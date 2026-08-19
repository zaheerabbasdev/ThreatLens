import type { ConfidenceLevel, ISODateString, Severity, WorkflowStatus } from "./common";

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  confidence: ConfidenceLevel;
  status: WorkflowStatus;
  source: string;
  affectedAssets: string[];
  relatedIndicatorIds: string[];
  relatedIncidentId?: string;
  createdAt: ISODateString;
}
