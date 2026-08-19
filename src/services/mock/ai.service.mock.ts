import type { AIService } from "@/services/ai.service";
import type { AIAnalysis, AIAssistantMessage, Recommendation } from "@/types";
import { MOCK_AI_ANALYSES, MOCK_RECOMMENDATIONS, getCannedAssistantAnswer } from "@/mocks/aiResponses";
import { generateId } from "@/utils/id";
import { delay } from "./util";

export class MockAIService implements AIService {
  async askAssistant(
    message: string,
    _context?: { incidentId?: string },
  ): Promise<AIAssistantMessage> {
    const content = getCannedAssistantAnswer(message);
    return delay(
      {
        id: generateId("ai_msg"),
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
      },
      700,
    );
  }

  async analyzeIncident(incidentId: string): Promise<AIAnalysis | null> {
    return delay(MOCK_AI_ANALYSES[incidentId] ?? null, 900);
  }

  async generateRecommendations(incidentId: string): Promise<Recommendation[]> {
    return delay(MOCK_RECOMMENDATIONS[incidentId] ?? [], 700);
  }

  async reviewRecommendation(
    recommendationId: string,
    status: "approved" | "rejected",
    reviewerId: string,
  ): Promise<Recommendation> {
    await delay(undefined, 400);
    for (const recommendations of Object.values(MOCK_RECOMMENDATIONS)) {
      const recommendation = recommendations.find((r) => r.id === recommendationId);
      if (recommendation) {
        recommendation.status = status;
        recommendation.reviewedBy = reviewerId;
        recommendation.reviewedAt = new Date().toISOString();
        return recommendation;
      }
    }
    throw new Error(`Recommendation ${recommendationId} not found.`);
  }
}
