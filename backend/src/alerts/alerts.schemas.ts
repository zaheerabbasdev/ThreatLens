import { z } from "zod";

const SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;
const STATUSES = ["new", "open", "investigating", "contained", "resolved", "closed", "false_positive"] as const;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  severity: z.enum(SEVERITIES).optional(),
  status: z.enum(STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
});
export type AlertListQuery = z.infer<typeof listQuerySchema>;

export const updateStatusSchema = z.object({
  status: z.enum(STATUSES),
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
