import { Schema, model } from "mongoose";
import type { ReportType } from "../../types/report.js";

export interface ReportDoc {
  _id: string;
  organizationId: string;
  type: ReportType;
  title: string;
  summary: string;
  generatedAt: Date;
  generatedBy: string;
  periodStart: Date;
  periodEnd: Date;
}

const TYPES = ["security_summary", "incident_report", "threat_intelligence", "risk_report", "activity_report"];

/** `_id` has no schema default — ReportService.create generates the ID itself (same as Investigation/Organization). Reports are immutable once created (no update method on the repository interface), so no updatedAt either. */
const reportSchema = new Schema<ReportDoc>(
  {
    _id: { type: String },
    organizationId: { type: String, required: true },
    type: { type: String, required: true, enum: TYPES },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    summary: { type: String, required: true, maxlength: 5000 },
    generatedAt: { type: Date, required: true },
    generatedBy: { type: String, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
  },
  { timestamps: false },
);

reportSchema.index({ organizationId: 1, type: 1 });
reportSchema.index({ organizationId: 1, generatedAt: -1 });

export const ReportModel = model<ReportDoc>("Report", reportSchema);
