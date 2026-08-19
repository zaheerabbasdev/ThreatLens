import type { WorkflowStatus } from "./common.js";

export interface InvestigationNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  isFinding: boolean;
}

export interface InvestigationTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  actor: string;
}

/** Mirrors the frontend's src/types/investigation.ts, with `organizationId` added — same reasoning as Incident. */
export interface Investigation {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  leadAnalystId: string;
  status: WorkflowStatus;
  relatedIncidentIds: string[];
  relatedIndicatorIds: string[];
  notes: InvestigationNote[];
  timeline: InvestigationTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}
