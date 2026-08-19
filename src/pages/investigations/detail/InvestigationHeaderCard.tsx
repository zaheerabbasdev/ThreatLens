import { useMemo } from "react";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";
import { Dropdown } from "@/components/Dropdown";
import { Icon } from "@/components/Icon";
import { useUpdateInvestigationStatus } from "@/api/useInvestigations";
import { useUsersList } from "@/api/useUsers";
import { usePermission } from "@/hooks/usePermission";
import { ACTIONABLE_STATUSES, STATUS_CONFIG } from "@/constants/status";
import { formatDateTime, formatShortId } from "@/utils/format";
import type { Investigation } from "@/types";
import styles from "./InvestigationHeaderCard.module.css";

export function InvestigationHeaderCard({ investigation }: { investigation: Investigation }) {
  const canWrite = usePermission("investigations:write");
  const { data: usersData } = useUsersList();
  const updateStatus = useUpdateInvestigationStatus(investigation.id);

  const leadAnalyst = useMemo(
    () => usersData?.items.find((u) => u.id === investigation.leadAnalystId),
    [usersData, investigation.leadAnalystId],
  );

  return (
    <Card>
      <div className={styles.top}>
        <span className={styles.idBadge}>{formatShortId(investigation.id)}</span>
        {canWrite ? (
          <Dropdown
            align="start"
            trigger={
              <span className={styles.statusTrigger}>
                <StatusBadge status={investigation.status} />
                <Icon name="chevron-down" size="xs" />
              </span>
            }
            items={ACTIONABLE_STATUSES.map((status) => ({
              label: STATUS_CONFIG[status].label,
              icon: STATUS_CONFIG[status].iconName,
              onSelect: () => updateStatus.mutate(status),
            }))}
          />
        ) : (
          <StatusBadge status={investigation.status} />
        )}
      </div>

      <h1 className={styles.title}>{investigation.title}</h1>
      <p className={styles.description}>{investigation.description}</p>

      <div className={styles.footer}>
        <div className={styles.lead}>
          <span className={styles.footerLabel}>Lead analyst</span>
          <span className={styles.leadValue}>
            <Avatar name={leadAnalyst?.name ?? "Unknown"} seed={investigation.leadAnalystId} size="sm" />
            {leadAnalyst?.name ?? "Unknown"}
          </span>
        </div>
        <div className={styles.timestamps}>
          <span>Opened {formatDateTime(investigation.createdAt)}</span>
          <span>Updated {formatDateTime(investigation.updatedAt)}</span>
        </div>
      </div>
    </Card>
  );
}
