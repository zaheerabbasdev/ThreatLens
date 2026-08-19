import { Schema, model } from "mongoose";
import { randomUUID } from "node:crypto";
import type { Severity, ConfidenceLevel, WorkflowStatus } from "../../types/common.js";

export interface IncidentTimelineEventDoc {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  actor?: string;
}
export interface IncidentEvidenceDoc {
  id: string;
  label: string;
  description: string;
  indicatorId?: string;
  collectedAt: Date;
}
export interface IncidentNoteDoc {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}
export interface BehavioralFindingDoc {
  id: string;
  label: string;
  normalBehavior: string;
  observedBehavior: string;
  anomalyScore: number;
}

export interface IncidentDoc {
  _id: string;
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
  timeline: IncidentTimelineEventDoc[];
  evidence: IncidentEvidenceDoc[];
  behavioralFindings: BehavioralFindingDoc[];
  notes: IncidentNoteDoc[];
  riskScoreId: string;
  createdAt: Date;
  updatedAt: Date;
}

const SEVERITIES = ["critical", "high", "medium", "low", "info"];
const CONFIDENCE_LEVELS = ["confirmed", "high", "medium", "low", "unverified"];
const STATUSES = ["new", "open", "investigating", "contained", "resolved", "closed", "false_positive"];

// `_id: false` on every subdocument — these already carry their own domain
// `id` field, so Mongoose's automatic ObjectId subdocument _id would just
// be a second, unused identifier on every embedded item.
const timelineEventSchema = new Schema<IncidentTimelineEventDoc>(
  { id: String, timestamp: Date, title: String, description: String, actor: String },
  { _id: false },
);
const evidenceSchema = new Schema<IncidentEvidenceDoc>(
  { id: String, label: String, description: String, indicatorId: String, collectedAt: Date },
  { _id: false },
);
const noteSchema = new Schema<IncidentNoteDoc>(
  { id: String, authorId: String, authorName: String, content: String, createdAt: Date },
  { _id: false },
);
const behavioralFindingSchema = new Schema<BehavioralFindingDoc>(
  { id: String, label: String, normalBehavior: String, observedBehavior: String, anomalyScore: Number },
  { _id: false },
);

/**
 * Indexes (spec §11): `organizationId` (every query is org-scoped —
 * load-bearing for all of them), plus a compound `{organizationId,
 * severity}` and `{organizationId, status}` since those are the two
 * documented list filters (IncidentListParams). Embedded arrays
 * (timeline/evidence/notes/behavioralFindings) stay bounded by realistic
 * incident activity, not literally unbounded (spec §10).
 */
const incidentSchema = new Schema<IncidentDoc>(
  {
    _id: { type: String, default: () => randomUUID() },
    organizationId: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true, maxlength: 5000 },
    severity: { type: String, required: true, enum: SEVERITIES },
    confidence: { type: String, required: true, enum: CONFIDENCE_LEVELS },
    status: { type: String, required: true, enum: STATUSES },
    assignedAnalystId: { type: String },
    affectedAssets: { type: [String], default: [] },
    indicatorIds: { type: [String], default: [] },
    mitreTechniqueIds: { type: [String], default: [] },
    timeline: { type: [timelineEventSchema], default: [] },
    evidence: { type: [evidenceSchema], default: [] },
    behavioralFindings: { type: [behavioralFindingSchema], default: [] },
    notes: { type: [noteSchema], default: [] },
    riskScoreId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

incidentSchema.index({ organizationId: 1, severity: 1 });
incidentSchema.index({ organizationId: 1, status: 1 });
incidentSchema.index({ organizationId: 1, createdAt: -1 });

export const IncidentModel = model<IncidentDoc>("Incident", incidentSchema);
