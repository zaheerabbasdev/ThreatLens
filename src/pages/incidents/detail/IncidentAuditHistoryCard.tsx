import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { useAuditForResource } from "@/api/useAudit";
import { formatRelativeTime } from "@/utils/format";
import styles from "./IncidentAuditHistoryCard.module.css";

export function IncidentAuditHistoryCard({ incidentId }: { incidentId: string }) {
  const { data: logs, isLoading } = useAuditForResource(incidentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit history</CardTitle>
      </CardHeader>
      {isLoading ? (
        <div className={styles.list}>
          <Skeleton height={18} />
          <Skeleton height={18} />
        </div>
      ) : !logs || logs.length === 0 ? (
        <EmptyState icon="clipboard-list" title="No audit events yet" description="Actions taken on this incident will be logged here." />
      ) : (
        <ul className={styles.list}>
          {logs.map((log) => (
            <li key={log.id} className={styles.item}>
              <Icon
                name={log.result === "success" ? "circle-check" : "circle-xmark"}
                size="xs"
                className={log.result === "success" ? styles.success : styles.failure}
              />
              <div className={styles.content}>
                <p className={styles.text}>
                  <strong>{log.actorName}</strong> — {log.action.replaceAll("_", " ").toLowerCase()}
                </p>
                <p className={styles.time}>{formatRelativeTime(log.timestamp)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
