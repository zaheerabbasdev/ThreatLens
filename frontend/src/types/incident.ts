import type { ConfidenceLevel, ISODateString, Severity, WorkflowStatus } from "./common";

export interface IncidentTimelineEvent {
  id: string;
  timestamp: ISODateString;
  title: string;
  description: string;
  actor?: string;
}

export interface IncidentEvidence {
  id: string;
  label: string;
  description: string;
  indicatorId?: string;
  collectedAt: ISODateString;
}

export interface IncidentNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: ISODateString;
}

export interface BehavioralFinding {
  id: string;
  label: string;
  normalBehavior: string;
  observedBehavior: string;
  anomalyScore: number;
}

export interface Incident {
  id: string;
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
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
