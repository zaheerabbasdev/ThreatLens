import { z } from "zod";

export const askAssistantSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  incidentId: z.string().min(1).max(128).optional(),
});
export type AskAssistantInput = z.infer<typeof askAssistantSchema>;

export const reviewRecommendationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});
export type ReviewRecommendationInput = z.infer<typeof reviewRecommendationSchema>;
