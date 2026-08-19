import { Schema, model } from "mongoose";
import { randomUUID } from "node:crypto";
import type { Severity, ConfidenceLevel, WorkflowStatus } from "../../types/common.js";

export interface AlertDoc {
  _id: string;
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
  createdAt: Date;
}

const SEVERITIES = ["critical", "high", "medium", "low", "info"];
const CONFIDENCE_LEVELS = ["confirmed", "high", "medium", "low", "unverified"];
const STATUSES = ["new", "open", "investigating", "contained", "resolved", "closed", "false_positive"];

/** Indexes: same reasoning as incident.model.ts — organizationId + the two documented list filters (severity, status). */
const alertSchema = new Schema<AlertDoc>(
  {
    _id: { type: String, default: () => randomUUID() },
    organizationId: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: { type: String, required: true, maxlength: 5000 },
    severity: { type: String, required: true, enum: SEVERITIES },
    confidence: { type: String, required: true, enum: CONFIDENCE_LEVELS },
    status: { type: String, required: true, enum: STATUSES },
    source: { type: String, required: true, maxlength: 200 },
    affectedAssets: { type: [String], default: [] },
    relatedIndicatorIds: { type: [String], default: [] },
    relatedIncidentId: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

alertSchema.index({ organizationId: 1, severity: 1 });
alertSchema.index({ organizationId: 1, status: 1 });
alertSchema.index({ organizationId: 1, createdAt: -1 });

export const AlertModel = model<AlertDoc>("Alert", alertSchema);
