import { useMemo } from "react";
import { Card } from "@/components/Card";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { Dropdown } from "@/components/Dropdown";
import { Icon } from "@/components/Icon";
import { useUpdateIncidentStatus, useAssignIncident } from "@/api/useIncidents";
import { useUsersList } from "@/api/useUsers";
import { usePermission } from "@/hooks/usePermission";
import { ACTIONABLE_STATUSES, STATUS_CONFIG } from "@/constants/status";
import { CONFIDENCE_LABEL } from "@/constants/severity";
import { formatDateTime, formatShortId } from "@/utils/format";
import type { Incident } from "@/types";
import styles from "./IncidentHeaderCard.module.css";

export function IncidentHeaderCard({ incident }: { incident: Incident }) {
  const canWrite = usePermission("incidents:write");
  const canAssign = usePermission("incidents:assign");
  const { data: usersData } = useUsersList();
  const updateStatus = useUpdateIncidentStatus();
  const assign = useAssignIncident();

  const assignedUser = useMemo(
    () => usersData?.items.find((u) => u.id === incident.assignedAnalystId),
    [usersData, incident.assignedAnalystId],
  );

  return (
    <Card>
      <div className={styles.top}>
        <span className={styles.idBadge}>{formatShortId(incident.id)}</span>
        <div className={styles.badgeRow}>
          <SeverityBadge severity={incident.severity} />
          {canWrite ? (
            <Dropdown
              align="start"
              trigger={
                <span className={styles.statusTrigger}>
                  <StatusBadge status={incident.status} />
                  <Icon name="chevron-down" size="xs" />
                </span>
              }
              items={ACTIONABLE_STATUSES.map((status) => ({
                label: STATUS_CONFIG[status].label,
                icon: STATUS_CONFIG[status].iconName,
                onSelect: () => updateStatus.mutate({ id: incident.id, status }),
              }))}
            />
          ) : (
            <StatusBadge status={incident.status} />
          )}
          <Badge>{CONFIDENCE_LABEL[incident.confidence]}</Badge>
        </div>
      </div>

      <h1 className={styles.title}>{incident.title}</h1>
      <p className={styles.description}>{incident.description}</p>

      {incident.affectedAssets.length > 0 && (
        <div className={styles.assets}>
          {incident.affectedAssets.map((asset) => (
            <span key={asset} className={styles.assetChip}>
              <Icon name="server" size="xs" />
              {asset}
            </span>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.assignee}>
          <span className={styles.footerLabel}>Assigned to</span>
          {canAssign ? (
            <Dropdown
              align="start"
              trigger={
                <span className={styles.assigneeTrigger}>
                  <Avatar
                    name={assignedUser?.name ?? "Unassigned"}
                    seed={incident.assignedAnalystId ?? "unassigned"}
                    size="sm"
                  />
                  {assignedUser?.name ?? "Unassigned"}
                  <Icon name="chevron-down" size="xs" />
                </span>
              }
              items={[
                ...(usersData?.items.map((u) => ({
                  label: u.name,
                  icon: "user" as const,
                  onSelect: () => assign.mutate({ id: incident.id, analystId: u.id }),
                })) ?? []),
                {
                  label: "Unassign",
                  icon: "xmark" as const,
                  tone: "danger" as const,
                  onSelect: () => assign.mutate({ id: incident.id, analystId: null }),
                },
              ]}
            />
          ) : (
            <span className={styles.assigneeTrigger}>
              <Avatar
                name={assignedUser?.name ?? "Unassigned"}
                seed={incident.assignedAnalystId ?? "unassigned"}
                size="sm"
              />
              {assignedUser?.name ?? "Unassigned"}
            </span>
          )}
        </div>
        <div className={styles.timestamps}>
          <span>Opened {formatDateTime(incident.createdAt)}</span>
          <span>Updated {formatDateTime(incident.updatedAt)}</span>
        </div>
      </div>
    </Card>
  );
}
