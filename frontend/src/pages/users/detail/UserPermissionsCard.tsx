import type { Role } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { ROLE_PERMISSIONS, ROLE_LABEL, type Permission } from "@/constants/roles";
import styles from "./UserPermissionsCard.module.css";

/** "incidents:write" -> "Incidents: write" — good enough for a reference list
 * without maintaining a second label map alongside the Permission union. */
function formatPermissionLabel(permission: Permission): string {
  const [area, action] = permission.split(":");
  const areaLabel = (area ?? permission).replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
  return action ? `${areaLabel}: ${action}` : areaLabel;
}

export function UserPermissionsCard({ role }: { role: Role }) {
  const permissions = ROLE_PERMISSIONS[role];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
      </CardHeader>
      <p className={styles.intro}>
        What the <strong>{ROLE_LABEL[role]}</strong> role grants. This reflects the frontend's
        permission matrix only — the future backend independently authorizes every request.
      </p>
      <ul className={styles.list}>
        {permissions.map((permission) => (
          <li key={permission} className={styles.item}>
            <Icon name="check" size="xs" className={styles.icon} />
            {formatPermissionLabel(permission)}
          </li>
        ))}
      </ul>
    </Card>
  );
}
