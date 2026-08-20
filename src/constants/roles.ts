import type { Role } from "@/types";

/**
 * Frontend-only permission matrix used to visually adapt the UI (hide/disable
 * actions and nav items). This is NOT a security boundary — the future
 * backend must independently authorize every request. See spec §8.
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

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  security_admin: "Security Admin",
  security_analyst: "Security Analyst",
  viewer: "Viewer",
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
