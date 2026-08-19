import { z } from "zod";

/**
 * The internal abstraction every AI call goes through (spec §50/§51) — no
 * OpenAI-specific code exists anywhere outside openaiProvider.ts. Swapping
 * providers (another hosted model, a local model, a future in-house one)
 * means writing one new class against this interface; nothing in
 * ai.service.ts or the routes/controllers built on it would change.
 */
export interface AIProvider {
  readonly label: string;
  answerQuestion(input: AnswerQuestionInput): Promise<AIResult<AnswerQuestionOutput>>;
  analyzeIncident(input: AnalyzeIncidentInput): Promise<AIResult<AnalyzeIncidentOutput>>;
  generateRecommendations(input: GenerateRecommendationsInput): Promise<AIResult<GenerateRecommendationsOutput>>;
}

/** Every provider call reports what it cost (spec §60), alongside its validated output. */
export interface AIResult<T> {
  output: T;
  tokensUsed?: number;
  durationMs: number;
}

export interface AnswerQuestionInput {
  question: string;
  /** Minimal, pre-selected incident context (spec §53 data minimization) — never a raw incident record. */
  incidentContext?: { id: string; title: string; description: string; status: string; severity: string };
}
export const answerQuestionOutputSchema = z.object({
  answer: z.string().min(1).max(4000),
});
export type AnswerQuestionOutput = z.infer<typeof answerQuestionOutputSchema>;

export interface AnalyzeIncidentInput {
  incident: {
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    affectedAssets: string[];
    mitreTechniqueIds: string[];
  };
}
export const analyzeIncidentOutputSchema = z.object({
  summary: z.string().min(1).max(2000),
  keyFindings: z.array(z.string().min(1).max(500)).max(10),
  suggestedMitreTechniqueIds: z.array(z.string().min(1).max(20)).max(10),
});
export type AnalyzeIncidentOutput = z.infer<typeof analyzeIncidentOutputSchema>;

export interface GenerateRecommendationsInput {
  incident: { id: string; title: string; description: string; severity: string; status: string };
}
export const generateRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.object({ title: z.string().min(1).max(200), description: z.string().min(1).max(1000) }))
    .min(1)
    .max(6),
});
export type GenerateRecommendationsOutput = z.infer<typeof generateRecommendationsOutputSchema>;

/** Thrown when the provider isn't configured, the call fails, or the model's output doesn't validate — the service layer maps this to a clean 502/503, never a raw provider error reaching a client. */
export class AIProviderError extends Error {}
