import type { ISODateString, WorkflowStatus } from "./common";

export interface InvestigationNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: ISODateString;
  /** Analyst-flagged as a key finding — surfaces separately in the workspace. */
  isFinding: boolean;
}

export interface InvestigationTimelineEvent {
  id: string;
  timestamp: ISODateString;
  title: string;
  description: string;
  actor: string;
}

/**
 * A case file correlating one or more incidents and indicators under a
 * single working theory. Unlike an Incident (one detected event), an
 * Investigation is analyst-driven and can span multiple incidents.
 */
export interface Investigation {
  id: string;
  title: string;
  description: string;
  leadAnalystId: string;
  status: WorkflowStatus;
  relatedIncidentIds: string[];
  relatedIndicatorIds: string[];
  notes: InvestigationNote[];
  timeline: InvestigationTimelineEvent[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
