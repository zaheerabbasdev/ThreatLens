import { Link } from "react-router-dom";
import { Card } from "@/components/Card";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/Badge";
import { Dropdown } from "@/components/Dropdown";
import { Icon } from "@/components/Icon";
import { useUpdateAlertStatus } from "@/api/useAlerts";
import { usePermission } from "@/hooks/usePermission";
import { ACTIONABLE_STATUSES, STATUS_CONFIG } from "@/constants/status";
import { CONFIDENCE_LABEL } from "@/constants/severity";
import { formatDateTime, formatShortId } from "@/utils/format";
import type { Alert } from "@/types";
import styles from "./AlertHeaderCard.module.css";

export function AlertHeaderCard({ alert }: { alert: Alert }) {
  const canWrite = usePermission("alerts:write");
  const updateStatus = useUpdateAlertStatus();

  return (
    <Card>
      <div className={styles.top}>
        <span className={styles.idBadge}>{formatShortId(alert.id)}</span>
        <div className={styles.badgeRow}>
          <SeverityBadge severity={alert.severity} />
          {canWrite ? (
            <Dropdown
              align="start"
              trigger={
                <span className={styles.statusTrigger}>
                  <StatusBadge status={alert.status} />
                  <Icon name="chevron-down" size="xs" />
                </span>
              }
              items={ACTIONABLE_STATUSES.map((status) => ({
                label: STATUS_CONFIG[status].label,
                icon: STATUS_CONFIG[status].iconName,
                onSelect: () => updateStatus.mutate({ id: alert.id, status }),
              }))}
            />
          ) : (
            <StatusBadge status={alert.status} />
          )}
          <Badge>{CONFIDENCE_LABEL[alert.confidence]}</Badge>
        </div>
      </div>

      <h1 className={styles.title}>{alert.title}</h1>
      <p className={styles.description}>{alert.description}</p>

      {alert.affectedAssets.length > 0 && (
        <div className={styles.assets}>
          {alert.affectedAssets.map((asset) => (
            <span key={asset} className={styles.assetChip}>
              <Icon name="server" size="xs" />
              {asset}
            </span>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.source}>
          <Icon name="bolt" size="xs" /> Source: {alert.source}
        </span>
        {alert.relatedIncidentId && (
          <Link to={`/app/incidents/${alert.relatedIncidentId}`} className={styles.relatedLink}>
            <Icon name="fire" size="xs" />
            Linked to {formatShortId(alert.relatedIncidentId)}
          </Link>
        )}
        <span className={styles.timestamp}>Detected {formatDateTime(alert.createdAt)}</span>
      </div>
    </Card>
  );
}
