import type { AuditLog } from "@/types";

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: "audit_1", actorId: "user_1", actorName: "Avery Chen", action: "LOGIN", resourceType: "session", ipAddress: "10.20.4.11", result: "success", severity: "info", timestamp: "2026-08-15T13:42:00Z" },
  { id: "audit_2", actorId: "user_3", actorName: "Diego Alvarez", action: "INCIDENT_UPDATED", resourceType: "incident", resourceId: "inc_1", ipAddress: "10.20.4.22", result: "success", severity: "low", timestamp: "2026-08-15T09:50:00Z" },
  { id: "audit_3", actorId: "user_3", actorName: "Diego Alvarez", action: "INCIDENT_CREATED", resourceType: "incident", resourceId: "inc_3", ipAddress: "10.20.4.22", result: "success", severity: "medium", timestamp: "2026-08-15T10:45:00Z" },
  { id: "audit_4", actorId: "unknown", actorName: "Unknown", action: "LOGIN_FAILED", resourceType: "session", ipAddress: "185.220.101.47", result: "failure", severity: "high", timestamp: "2026-08-15T10:41:00Z" },
  { id: "audit_5", actorId: "user_4", actorName: "Morgan Blake", action: "IOC_SUBMITTED", resourceType: "indicator", resourceId: "ind_9", ipAddress: "10.20.4.31", result: "success", severity: "info", timestamp: "2026-08-14T21:50:00Z" },
];
