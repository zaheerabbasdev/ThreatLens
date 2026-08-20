import { z } from "zod";

// "recommended_action" is deliberately excluded — that value is only ever
// set internally by applyRecommendation(), never something a client
// requests directly (see types/responseAction.ts).
const REQUESTABLE_TYPES = [
  "block_ip",
  "block_domain",
  "isolate_host",
  "disable_user_account",
  "force_password_reset",
  "quarantine_file",
] as const;

export const requestActionSchema = z.object({
  incidentId: z.string().min(1).max(128),
  type: z.enum(REQUESTABLE_TYPES),
  target: z.string().trim().min(1).max(500),
  description: z.string().trim().min(1).max(2000),
});
export type RequestActionInput = z.infer<typeof requestActionSchema>;

export const listQuerySchema = z.object({
  incidentId: z.string().min(1).max(128),
});
export type ListQuery = z.infer<typeof listQuerySchema>;
