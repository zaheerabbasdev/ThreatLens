import type { AIService } from "@/services/ai.service";
import type { AIAnalysis, AIAssistantMessage, Recommendation } from "@/types";
import { apiRequest, ApiError } from "./client";

export class ApiAIService implements AIService {
  askAssistant(message: string, context?: { incidentId?: string }): Promise<AIAssistantMessage> {
    return apiRequest<AIAssistantMessage>("/ai/assistant", { method: "POST", body: { message, incidentId: context?.incidentId } });
  }

  /**
   * The backend's `GET /ai/incidents/:incidentId/analysis` is get-or-
   * generate (it calls the real AI provider if nothing is cached yet) —
   * MockAIService's read-only "return existing or null" contract doesn't
   * have an exact server-side equivalent, since there's no real AI
   * provider to have pre-generated anything against in a fresh deployment.
   * A `503` (AI not configured for this deployment — see backend/README.md's
   * Phase 6 section) is treated as "no analysis available" (`null`) rather
   * than a hard error, so the UI degrades to an empty state instead of an
   * error boundary; every other failure (e.g. a genuinely missing incident)
   * still throws.
   */
  async analyzeIncident(incidentId: string): Promise<AIAnalysis | null> {
    try {
      return await apiRequest<AIAnalysis>(`/ai/incidents/${incidentId}/analysis`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) return null;
      throw err;
    }
  }

  generateRecommendations(incidentId: string): Promise<Recommendation[]> {
    return apiRequest<Recommendation[]>(`/ai/incidents/${incidentId}/recommendations`, { method: "POST" });
  }

  // `reviewerId` is accepted for the mock's sake but ignored — the real
  // backend resolves the reviewer from the authenticated session
  // server-side, same non-spoofable-actor rule as everywhere else.
  reviewRecommendation(recommendationId: string, status: "approved" | "rejected"): Promise<Recommendation> {
    return apiRequest<Recommendation>(`/ai/recommendations/${recommendationId}/review`, { method: "POST", body: { status } });
  }
}
