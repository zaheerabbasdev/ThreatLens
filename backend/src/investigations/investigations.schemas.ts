import { z } from "zod";

const STATUSES = ["new", "open", "investigating", "contained", "resolved", "closed", "false_positive"] as const;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
});
export type InvestigationListQuery = z.infer<typeof listQuerySchema>;

export const createSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(1).max(5000),
  leadAnalystId: z.string().min(1).max(128),
});
export type CreateInvestigationInput = z.infer<typeof createSchema>;

export const updateStatusSchema = z.object({
  status: z.enum(STATUSES),
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const addNoteSchema = z.object({
  content: z.string().trim().min(1, "Note can't be empty").max(5000),
  isFinding: z.boolean().default(false),
});
export type AddNoteInput = z.infer<typeof addNoteSchema>;

export const linkIncidentSchema = z.object({
  incidentId: z.string().min(1).max(128),
});
export type LinkIncidentInput = z.infer<typeof linkIncidentSchema>;

export const linkIndicatorSchema = z.object({
  indicatorId: z.string().min(1).max(128),
});
export type LinkIndicatorInput = z.infer<typeof linkIndicatorSchema>;
