import { z } from "zod";

const ROLES = ["super_admin", "security_admin", "security_analyst", "viewer"] as const;
const STATUSES = ["active", "invited", "suspended", "deactivated"] as const;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(ROLES).optional(),
  status: z.enum(STATUSES).optional(),
  search: z.string().trim().max(200).optional(),
});
export type UserListQuery = z.infer<typeof listQuerySchema>;

export const updateRoleSchema = z.object({
  role: z.enum(ROLES),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const updateStatusSchema = z.object({
  status: z.enum(STATUSES),
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  title: z.string().trim().max(120).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const setMfaEnabledSchema = z.object({
  enabled: z.boolean(),
});
export type SetMfaEnabledInput = z.infer<typeof setMfaEnabledSchema>;
