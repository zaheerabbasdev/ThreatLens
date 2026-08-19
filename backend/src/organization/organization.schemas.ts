import { z } from "zod";

export const updateNameSchema = z.object({
  name: z.string().trim().min(2).max(120),
});
export type UpdateNameInput = z.infer<typeof updateNameSchema>;
