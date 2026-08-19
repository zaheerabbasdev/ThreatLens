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
