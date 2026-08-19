import { z } from "zod";

const SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;
const STATUSES = ["new", "open", "investigating", "contained", "resolved", "closed", "false_positive"] as const;

/**
 * Pagination limits (spec §22: "Prevent attackers from sending enormous
 * payloads" / query complexity) — pageSize is capped, not just defaulted.
 */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  severity: z.enum(SEVERITIES).optional(),
  status: z.enum(STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
});
export type IncidentListQuery = z.infer<typeof listQuerySchema>;

export const updateStatusSchema = z.object({
  status: z.enum(STATUSES),
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const assignSchema = z.object({
  analystId: z.string().min(1).max(128).nullable(),
});
export type AssignInput = z.infer<typeof assignSchema>;

export const addNoteSchema = z.object({
  content: z.string().trim().min(1, "Note can't be empty").max(5000),
});
export type AddNoteInput = z.infer<typeof addNoteSchema>;
