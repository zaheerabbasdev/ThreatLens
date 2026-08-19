import type { AIAnalysis, AIAssistantMessage, Recommendation } from "@/types";

/**
 * AI layer contract. Implemented today by MockAIService with canned,
 * clearly-labeled responses — no real model is called in this phase (spec
 * §36/§38). Business logic and components depend only on this interface so
 * a future provider-backed implementation is a drop-in replacement.
 */
export interface AIService {
  askAssistant(
    message: string,
    context?: { incidentId?: string },
  ): Promise<AIAssistantMessage>;
  analyzeIncident(incidentId: string): Promise<AIAnalysis | null>;
  generateRecommendations(incidentId: string): Promise<Recommendation[]>;
  /** Human-in-the-loop review — a recommendation never auto-applies (spec §58). */
  reviewRecommendation(
    recommendationId: string,
    status: "approved" | "rejected",
    reviewerId: string,
  ): Promise<Recommendation>;
}
