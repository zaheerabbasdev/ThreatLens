/**
 * Union of the frontend's AuditAction (src/types/audit.ts) and the spec's
 * required action list (§38) — kept as one superset since some spec actions
 * (AI_*, RECOMMENDATION_CREATED) aren't emitted yet yet (those modules are
 * later phases) but the type is ready for when they are.
 */
export type AuditAction =
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "MFA_CHANGED"
  | "ROLE_CHANGED"
  | "USER_CREATED"
  | "USER_INVITED"
  | "USER_STATUS_CHANGED"
  | "PROFILE_UPDATED"
  | "INCIDENT_CREATED"
  | "INCIDENT_UPDATED"
  | "INCIDENT_ASSIGNED"
  | "ALERT_UPDATED"
  | "INVESTIGATION_CREATED"
  | "INVESTIGATION_UPDATED"
  | "IOC_SUBMITTED"
  | "IOC_ANALYZED"
  | "AI_ANALYSIS_REQUESTED"
  | "AI_ANALYSIS_COMPLETED"
  | "RECOMMENDATION_CREATED"
  | "RECOMMENDATION_APPROVED"
  | "RECOMMENDATION_REJECTED"
  | "REPORT_EXPORTED"
  | "SECURITY_SETTING_CHANGED"
  | "ANOMALY_DETECTED"
  | "RESPONSE_ACTION_REQUESTED"
  | "RESPONSE_ACTION_EXECUTED"
  | "RESPONSE_ACTION_REJECTED";

export type AuditResult = "success" | "failure";
export type AuditSeverity = "info" | "low" | "medium" | "high";

/**
 * Mirrors the frontend's AuditLog, plus `organizationId` (tenant scoping,
 * same as every other domain type) and `requestId` (spec §38 explicitly
 * lists it as a required field, tying an audit record back to the exact
 * request that produced it).
 */
export interface AuditLog {
  id: string;
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
  timestamp: string;
}
