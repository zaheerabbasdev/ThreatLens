import { Schema, model } from "mongoose";
import { randomUUID } from "node:crypto";
import type { Severity } from "../../types/common.js";
import type { SecurityEventType } from "../../types/securityEvent.js";

export interface SecurityEventDoc {
  _id: string;
  organizationId: string;
  userId?: string;
  type: SecurityEventType;
  description: string;
  severity: Severity;
  sourceIp?: string;
  isNewLocation?: boolean;
  authFailed?: boolean;
  isDownload?: boolean;
  endpoint?: string;
  timestamp: Date;
}

const SEVERITIES = ["critical", "high", "medium", "low", "info"];
const TYPES = ["authentication", "network", "file_access", "configuration_change", "anomaly"];

/**
 * Indexes: `organizationId` (load-bearing for every query), compound
 * `{organizationId, userId, timestamp}` for `listForUser` — the query
 * feature extraction actually runs, ordered by time, scoped to one user
 * within one org.
 */
const securityEventSchema = new Schema<SecurityEventDoc>(
  {
    _id: { type: String, default: () => randomUUID() },
    organizationId: { type: String, required: true },
    userId: { type: String },
    type: { type: String, required: true, enum: TYPES },
    description: { type: String, required: true, maxlength: 2000 },
    severity: { type: String, required: true, enum: SEVERITIES },
    sourceIp: String,
    isNewLocation: Boolean,
    authFailed: Boolean,
    isDownload: Boolean,
    endpoint: { type: String, maxlength: 500 },
    timestamp: { type: Date, required: true },
  },
  { timestamps: false },
);

securityEventSchema.index({ organizationId: 1, userId: 1, timestamp: 1 });
securityEventSchema.index({ organizationId: 1, timestamp: -1 });

export const SecurityEventModel = model<SecurityEventDoc>("SecurityEvent", securityEventSchema);
