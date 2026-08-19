import { Schema, model } from "mongoose";
import { randomUUID } from "node:crypto";
import type { AuditAction, AuditResult, AuditSeverity } from "../../types/audit.js";

export interface AuditLogDoc {
  _id: string;
  organizationId: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  ipAddress: string;
  requestId: string;
  result: AuditResult;
  severity: AuditSeverity;
  timestamp: Date;
}

const ACTIONS = [
  "LOGIN",
  "LOGIN_FAILED",
  "LOGOUT",
  "PASSWORD_CHANGED",
  "MFA_CHANGED",
  "ROLE_CHANGED",
  "USER_CREATED",
  "USER_STATUS_CHANGED",
  "PROFILE_UPDATED",
  "INCIDENT_CREATED",
  "INCIDENT_UPDATED",
  "INCIDENT_ASSIGNED",
  "ALERT_UPDATED",
  "INVESTIGATION_CREATED",
  "INVESTIGATION_UPDATED",
  "IOC_SUBMITTED",
  "IOC_ANALYZED",
  "AI_ANALYSIS_REQUESTED",
  "AI_ANALYSIS_COMPLETED",
  "RECOMMENDATION_CREATED",
  "RECOMMENDATION_APPROVED",
  "RECOMMENDATION_REJECTED",
  "REPORT_EXPORTED",
  "SECURITY_SETTING_CHANGED",
];

/**
 * Append-only (spec §39). Every field is `immutable: true` — Mongoose
 * rejects a `save()` that tries to change any of them on an existing
 * document — as defense in depth behind the real enforcement, which is
 * that MongoAuditLogRepository (like the interface it implements) simply
 * has no update/delete method at all; there's no code path that could
 * even attempt one.
 *
 * Indexes (spec §11: audit actor, event timestamp; §38's own field list):
 * organizationId (load-bearing for every query), plus the two documented
 * list filters (action, result) and timestamp for the default sort order.
 */
const auditLogSchema = new Schema<AuditLogDoc>(
  {
    _id: { type: String, default: () => randomUUID(), immutable: true },
    organizationId: { type: String, required: true, immutable: true },
    actorId: { type: String, required: true, immutable: true },
    actorName: { type: String, required: true, immutable: true },
    action: { type: String, required: true, enum: ACTIONS, immutable: true },
    resourceType: { type: String, required: true, immutable: true },
    resourceId: { type: String, immutable: true },
    ipAddress: { type: String, required: true, immutable: true },
    requestId: { type: String, required: true, immutable: true },
    result: { type: String, required: true, enum: ["success", "failure"], immutable: true },
    severity: { type: String, required: true, enum: ["info", "low", "medium", "high"], immutable: true },
    timestamp: { type: Date, required: true, immutable: true },
  },
  { timestamps: false },
);

auditLogSchema.index({ organizationId: 1, action: 1 });
auditLogSchema.index({ organizationId: 1, result: 1 });
auditLogSchema.index({ organizationId: 1, timestamp: -1 });

export const AuditLogModel = model<AuditLogDoc>("AuditLog", auditLogSchema);
