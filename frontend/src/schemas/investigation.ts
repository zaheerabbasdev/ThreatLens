import { z } from "zod";

export const investigationNoteSchema = z.object({
  content: z.string().trim().min(1, "Note can't be empty").max(2000, "Keep notes under 2000 characters"),
  isFinding: z.boolean().optional(),
});
export type InvestigationNoteInput = z.infer<typeof investigationNoteSchema>;

export const createInvestigationSchema = z.object({
  title: z.string().trim().min(3, "Give the investigation a short title"),
  description: z
    .string()
    .trim()
    .min(10, "Describe what you're investigating in a sentence or two")
    .max(1000, "Keep the description under 1000 characters"),
});
export type CreateInvestigationInput = z.infer<typeof createInvestigationSchema>;
