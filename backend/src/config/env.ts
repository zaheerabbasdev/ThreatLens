import { z } from "zod";

/**
 * Validated environment configuration. The process must fail at startup if a
 * required variable is missing or malformed — never silently continue with
 * undefined security configuration (spec §5, §6).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  // Explicit allowlist, never "*" for an authenticated API (spec §26).
  CORS_ALLOWED_ORIGINS: z
    .string()
    .min(1, "CORS_ALLOWED_ORIGINS must list at least one allowed origin")
    .transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean)),

  // Signing secrets for access/refresh JWTs — deliberately separate keys so
  // compromising one token type doesn't compromise the other (spec §17).
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),

  // Optional: when unset, server.ts falls back to the in-memory repositories
  // (unchanged from Phase 3) — lets local dev run without a real database.
  // When set, it must be a real mongodb:// or mongodb+srv:// URI (spec §12:
  // encrypted connections, no public unrestricted access) — never a bare
  // "trust whatever string shows up" pass-through.
  MONGODB_URI: z
    .string()
    .trim()
    .refine((v) => v === "" || v.startsWith("mongodb://") || v.startsWith("mongodb+srv://"), {
      message: "MONGODB_URI must start with mongodb:// or mongodb+srv://",
    })
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  // Optional: when unset, AI endpoints fail with a clear "not configured"
  // error rather than silently returning canned/fake content — unlike the
  // database, a "fallback" AI provider would mean fabricated analysis,
  // which is exactly what spec §52 forbids. See ai/aiProvider.ts.
  OPENAI_API_KEY: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  OPENAI_MODEL: z.string().trim().default("gpt-4o-mini"),
  // Cost control (spec §60) — a hard ceiling independent of the per-route
  // rate limiter, since that limits *requests*, not spend if request sizes
  // vary. Per organization, per rolling 24h window.
  AI_DAILY_REQUEST_LIMIT_PER_ORG: z.coerce.number().int().positive().default(200),

  // Optional: when unset, IOC enrichment has zero providers configured and
  // POST /ioc/:id/enrich fails with a clear "not configured" 503 — same
  // "never fabricate, just say so" posture as OPENAI_API_KEY above (spec
  // §40). See threatIntel/virusTotalProvider.ts.
  VIRUSTOTAL_API_KEY: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  // Skip re-querying a provider for the same indicator within this window —
  // avoids burning API quota on repeated clicks, and gives "stale data"
  // (spec §40) an explicit, tunable meaning instead of an implicit one.
  IOC_ENRICHMENT_STALE_AFTER_HOURS: z.coerce.number().int().positive().default(24),

  // Optional: when unset, anomaly detection has no provider configured and
  // POST /security-events/analyze/:userId fails with a clear "not
  // configured" 503 — same posture as OPENAI_API_KEY/VIRUSTOTAL_API_KEY
  // above (spec §42). Points at the self-hosted Python FastAPI service in
  // ml-service/, not a third-party API — see backend/README.md's Phase 8
  // section.
  ML_SERVICE_URL: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Intentionally verbose on stderr only — this runs before the logger
    // exists, and never before secrets are known-valid, so there's nothing
    // sensitive to redact here (just field names and validation issues).
    console.error("Invalid environment configuration:");
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
