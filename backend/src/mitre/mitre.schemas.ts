import { z } from "zod";

export const listTechniquesQuerySchema = z.object({
  tacticId: z.string().trim().max(50).optional(),
  search: z.string().trim().max(200).optional(),
});
export type ListTechniquesQuery = z.infer<typeof listTechniquesQuerySchema>;
