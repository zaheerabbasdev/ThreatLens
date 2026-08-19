import { z } from "zod";

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
] as const;
const RESULTS = ["success", "failure"] as const;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: z.enum(ACTIONS).optional(),
  result: z.enum(RESULTS).optional(),
  search: z.string().trim().max(200).optional(),
});
export type AuditListQuery = z.infer<typeof listQuerySchema>;
