import type { ConfidenceLevel, Severity, WorkflowStatus } from "./common.js";

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  actor?: string;
}

export interface IncidentEvidence {
  id: string;
  label: string;
  description: string;
  indicatorId?: string;
  collectedAt: string;
}

export interface IncidentNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface BehavioralFinding {
  id: string;
  label: string;
  normalBehavior: string;
  observedBehavior: string;
  anomalyScore: number;
}

/**
 * Mirrors the frontend's src/types/incident.ts, with `organizationId` added
 * — the frontend's single-tenant demo data doesn't need it, but the backend
 * enforces tenant isolation on every query (spec §20), so it has to exist
 * here even though the API response shape otherwise matches.
 */
export interface Incident {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  severity: Severity;
  confidence: ConfidenceLevel;
  status: WorkflowStatus;
  assignedAnalystId?: string;
  affectedAssets: string[];
  indicatorIds: string[];
  mitreTechniqueIds: string[];
  timeline: IncidentTimelineEvent[];
  evidence: IncidentEvidence[];
  behavioralFindings: BehavioralFinding[];
  notes: IncidentNote[];
  riskScoreId: string;
  createdAt: string;
  updatedAt: string;
}
