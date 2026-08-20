import { z } from "zod";

const TYPES = ["authentication", "network", "file_access", "configuration_change", "anomaly"] as const;
const SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;

export const ingestEventSchema = z.object({
  userId: z.string().trim().min(1).max(128).optional(),
  type: z.enum(TYPES),
  description: z.string().trim().min(1).max(2000),
  severity: z.enum(SEVERITIES),
  sourceIp: z.string().trim().max(64).optional(),
  isNewLocation: z.boolean().optional(),
  authFailed: z.boolean().optional(),
  isDownload: z.boolean().optional(),
  endpoint: z.string().trim().max(500).optional(),
  // Optional so an ingesting system doesn't have to compute "now" itself;
  // defaults server-side in the service if omitted.
  timestamp: z.string().datetime().optional(),
});
export type IngestEventInput = z.infer<typeof ingestEventSchema>;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type EventListQuery = z.infer<typeof listQuerySchema>;

export const analyzeQuerySchema = z.object({
  // Hours of recent activity to score; capped at 30 days so a single
  // request can't force scanning a user's entire history.
  windowHours: z.coerce.number().int().min(1).max(24 * 30).default(24),
});
export type AnalyzeQuery = z.infer<typeof analyzeQuerySchema>;
