import type { Role } from "../types/user.js";

/**
 * The real permission boundary (spec §18: "Frontend permission checks are
 * only UX. They are NOT security."). This mirrors the frontend's
 * src/constants/roles.ts matrix — until a shared package exists, the two
 * must be kept in sync by hand; a mismatch here is a security gap, not a
 * cosmetic one, since this copy is the one that's actually enforced.
 */
export type Permission =
  | "incidents:read"
  | "incidents:write"
  | "incidents:assign"
  | "alerts:read"
  | "alerts:write"
  | "ioc:submit"
  | "ioc:read"
  | "ioc:enrich"
  | "threat_graph:read"
  | "anomaly:read"
  | "anomaly:detect"
  | "investigations:read"
  | "investigations:write"
  | "reports:read"
  | "reports:generate"
  | "users:read"
  | "users:manage"
  | "settings:read"
  | "settings:manage"
  | "audit:read"
  | "recommendations:approve"
  | "response:request"
  | "response:execute";

const ALL_PERMISSIONS: Permission[] = [
  "incidents:read",
  "incidents:write",
  "incidents:assign",
  "alerts:read",
  "alerts:write",
  "ioc:submit",
  "ioc:read",
  "ioc:enrich",
  "threat_graph:read",
  "anomaly:read",
  "anomaly:detect",
  "investigations:read",
  "investigations:write",
  "reports:read",
  "reports:generate",
  "users:read",
  "users:manage",
  "settings:read",
  "settings:manage",
  "audit:read",
  "recommendations:approve",
  "response:request",
  "response:execute",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  security_admin: ALL_PERMISSIONS.filter((p) => p !== "users:manage"),
  security_analyst: [
    "incidents:read",
    "incidents:write",
    "incidents:assign",
    "alerts:read",
    "alerts:write",
    "ioc:submit",
    "ioc:read",
    "ioc:enrich",
    "threat_graph:read",
    "anomaly:read",
    "anomaly:detect",
    "investigations:read",
    "investigations:write",
    "reports:read",
    "reports:generate",
    "settings:read",
    "audit:read",
    // Executing/rejecting response actions and applying an approved
    // recommendation stay admin-only (spec: critical actions require human
    // approval by an appropriately privileged role) — same tier as
    // recommendations:approve, deliberately excluded here.
    "response:request",
  ],
  viewer: [
    "incidents:read",
    "alerts:read",
    "ioc:read",
    "threat_graph:read",
    "anomaly:read",
    "investigations:read",
    "reports:read",
    "settings:read",
    "audit:read",
  ],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
