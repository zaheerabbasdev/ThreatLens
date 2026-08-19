import type { ISODateString } from "./common";

export type AuditAction =
  | "LOGIN"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "ROLE_CHANGED"
  | "USER_STATUS_CHANGED"
  | "PROFILE_UPDATED"
  | "INCIDENT_CREATED"
  | "INCIDENT_UPDATED"
  | "ALERT_UPDATED"
  | "INVESTIGATION_CREATED"
  | "INVESTIGATION_UPDATED"
  | "IOC_SUBMITTED"
  | "IOC_ANALYZED"
  | "AI_ANALYSIS_REQUESTED"
  | "AI_ANALYSIS_COMPLETED"
  | "RECOMMENDATION_APPROVED"
  | "RECOMMENDATION_REJECTED"
  | "EXPORT_CREATED";

export type AuditResult = "success" | "failure";

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  ipAddress: string;
  result: AuditResult;
  severity: "info" | "low" | "medium" | "high";
  timestamp: ISODateString;
}
