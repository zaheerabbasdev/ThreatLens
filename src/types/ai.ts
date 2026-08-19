import type { ISODateString } from "./common";

export type RecommendationStatus = "pending" | "approved" | "rejected" | "applied";

/**
 * A recommended response action. Always AI-labeled in the UI and always
 * requires explicit human approval before it is treated as "applied" —
 * see spec §58 Human-in-the-loop. Nothing here executes automatically.
 */
export interface Recommendation {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  status: RecommendationStatus;
  generatedBy: "ai";
  reviewedBy?: string;
  reviewedAt?: ISODateString;
}

/**
 * AI-generated narrative analysis attached to an incident. Must always be
 * rendered as clearly AI-generated and visually distinct from deterministic
 * findings (risk score, correlation evidence).
 */
export interface AIAnalysis {
  id: string;
  incidentId: string;
  summary: string;
  keyFindings: string[];
  suggestedMitreTechniqueIds: string[];
  generatedAt: ISODateString;
  modelLabel: string;
  disclaimer: string;
}

export interface AIAssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: ISODateString;
  relatedIncidentId?: string;
}
