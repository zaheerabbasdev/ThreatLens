import { Schema, model } from "mongoose";
import type { WorkflowStatus } from "../../types/common.js";

export interface InvestigationNoteDoc {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
  isFinding: boolean;
}
export interface InvestigationTimelineEventDoc {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  actor: string;
}

export interface InvestigationDoc {
  _id: string;
  organizationId: string;
  title: string;
  description: string;
  leadAnalystId: string;
  status: WorkflowStatus;
  relatedIncidentIds: string[];
  relatedIndicatorIds: string[];
  notes: InvestigationNoteDoc[];
  timeline: InvestigationTimelineEventDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const STATUSES = ["new", "open", "investigating", "contained", "resolved", "closed", "false_positive"];

const noteSchema = new Schema<InvestigationNoteDoc>(
  { id: String, authorId: String, authorName: String, content: String, createdAt: Date, isFinding: Boolean },
  { _id: false },
);
const timelineEventSchema = new Schema<InvestigationTimelineEventDoc>(
  { id: String, timestamp: Date, title: String, description: String, actor: String },
  { _id: false },
);

/**
 * `_id` has no schema default here (unlike most other models) — the
 * service layer (InvestigationsService.create) already generates the ID
 * itself before calling repository.create(), same as Organization.
 * Indexes: organizationId + status (the one documented list filter) +
 * updatedAt (list is sorted by it).
 */
const investigationSchema = new Schema<InvestigationDoc>(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true, maxlength: 5000 },
    leadAnalystId: { type: String, required: true },
    status: { type: String, required: true, enum: STATUSES },
    relatedIncidentIds: { type: [String], default: [] },
    relatedIndicatorIds: { type: [String], default: [] },
    notes: { type: [noteSchema], default: [] },
    timeline: { type: [timelineEventSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

investigationSchema.index({ organizationId: 1, status: 1 });
investigationSchema.index({ organizationId: 1, updatedAt: -1 });

export const InvestigationModel = model<InvestigationDoc>("Investigation", investigationSchema);
