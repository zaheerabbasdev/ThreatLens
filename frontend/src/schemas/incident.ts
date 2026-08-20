import { z } from "zod";

export const incidentNoteSchema = z.object({
  content: z.string().trim().min(1, "Note can't be empty").max(2000, "Keep notes under 2000 characters"),
});
export type IncidentNoteInput = z.infer<typeof incidentNoteSchema>;
