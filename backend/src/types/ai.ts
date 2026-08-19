export type RecommendationStatus = "pending" | "approved" | "rejected" | "applied";

/**
 * Mirrors the frontend's Recommendation type. Always AI-labeled
 * (`generatedBy: "ai"`) and never auto-applied — `status` starts
 * "pending" and only a human reviewer moves it to approved/rejected
 * (spec §57/§58). Nothing in this codebase transitions a recommendation
 * to "applied" automatically; that would be wiring a real response
 * workflow (Phase 10) to an approved recommendation, not an AI action.
 */
export interface Recommendation {
  id: string;
  organizationId: string;
  incidentId: string;
  title: string;
  description: string;
  status: RecommendationStatus;
  generatedBy: "ai";
  reviewedBy?: string;
  reviewedAt?: string;
}

/** Mirrors the frontend's AIAnalysis type — always rendered as clearly AI-generated, never as a deterministic finding (spec §52). */
export interface AIAnalysis {
  id: string;
  organizationId: string;
  incidentId: string;
  summary: string;
  keyFindings: string[];
  suggestedMitreTechniqueIds: string[];
  generatedAt: string;
  modelLabel: string;
  disclaimer: string;
}

export interface AIAssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  relatedIncidentId?: string;
}
