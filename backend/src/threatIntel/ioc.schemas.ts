import { isIP } from "node:net";
import { z } from "zod";

const TYPES = ["ip", "domain", "url", "hash"] as const;
const SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;

const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
const HEX_PATTERN = /^[a-f0-9]+$/i;

/**
 * Format validation per indicator type (spec §21). Real enrichment/
 * normalization (resolving ASN, registrar lookups, ...) is Phase 7 —
 * this is just "is this actually shaped like an IP/domain/URL/hash",
 * rejecting obvious garbage before it's stored at all.
 */
export const submitSchema = z
  .object({
    type: z.enum(TYPES),
    value: z.string().trim().min(1).max(2048),
    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    switch (data.type) {
      case "ip":
        if (isIP(data.value) === 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Enter a valid IPv4 or IPv6 address." });
        }
        break;
      case "domain":
        if (!DOMAIN_PATTERN.test(data.value) || data.value.length > 253) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Enter a valid domain name." });
        }
        break;
      case "url": {
        let url: URL;
        try {
          url = new URL(data.value.includes("://") ? data.value : `https://${data.value}`);
        } catch {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Enter a valid URL." });
          break;
        }
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: "Only http(s) URLs are accepted." });
        }
        break;
      }
      case "hash":
        if (!HEX_PATTERN.test(data.value) || ![32, 40, 64].includes(data.value.length)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["value"],
            message: "Enter a valid MD5 (32), SHA-1 (40), or SHA-256 (64) hex hash.",
          });
        }
        break;
    }
  });
export type SubmitInput = z.infer<typeof submitSchema>;

export const enrichQuerySchema = z.object({
  // Bypasses the staleness cache (spec §40's "stale data" handling) —
  // deliberately opt-in, so a normal click never re-burns provider quota
  // for data fetched moments ago.
  force: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});
export type EnrichQuery = z.infer<typeof enrichQuerySchema>;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(TYPES).optional(),
  severity: z.enum(SEVERITIES).optional(),
  search: z.string().trim().max(200).optional(),
});
export type IOCListQuery = z.infer<typeof listQuerySchema>;
