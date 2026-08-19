import type { ConfidenceLevel, Severity, WorkflowStatus } from "./common.js";

/** Mirrors the frontend's src/types/alert.ts, with `organizationId` added — same reasoning as Incident (see src/types/incident.ts). */
export interface Alert {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  severity: Severity;
  confidence: ConfidenceLevel;
  status: WorkflowStatus;
  source: string;
  affectedAssets: string[];
  relatedIndicatorIds: string[];
  relatedIncidentId?: string;
  createdAt: string;
}
