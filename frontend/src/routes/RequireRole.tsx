import type { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";
import type { Permission } from "@/constants/roles";
import { Forbidden } from "@/pages/system/Forbidden";

/**
 * Frontend-only gate that renders the shared Forbidden state when the
 * signed-in role lacks the given permission. Not a security boundary — see
 * spec §8; the future backend independently authorizes every request.
 */
export function RequireRole({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const allowed = usePermission(permission);
  if (!allowed) return <Forbidden />;
  return children;
}
