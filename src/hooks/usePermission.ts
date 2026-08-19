import { useAuth } from "./useAuth";
import { roleHasPermission, type Permission } from "@/constants/roles";

/**
 * Frontend-only permission check for adapting the UI. NOT a security
 * boundary — see spec §8. The future backend independently authorizes
 * every request regardless of what this hook returns.
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();
  if (!user) return false;
  return roleHasPermission(user.role, permission);
}
