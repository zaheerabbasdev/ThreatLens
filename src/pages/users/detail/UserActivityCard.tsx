import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { useAuditByActor } from "@/api/useAudit";
import { formatRelativeTime } from "@/utils/format";
import styles from "./UserActivityCard.module.css";

/** Actions this user has taken across the workspace — distinct from an
 * audit trail of changes made TO this account (that's shown via the badges'
 * own history when relevant); this is what they did. */
export function UserActivityCard({ userId }: { userId: string }) {
  const { data: logs, isLoading } = useAuditByActor(userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      {isLoading ? (
        <div className={styles.list}>
          <Skeleton height={18} />
          <Skeleton height={18} />
          <Skeleton height={18} />
        </div>
      ) : !logs || logs.length === 0 ? (
        <EmptyState
          icon="clipboard-list"
          title="No activity yet"
          description="Actions this user takes will be logged here."
        />
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
                  {log.action.replaceAll("_", " ").toLowerCase()}
                  {log.resourceId ? ` — ${log.resourceType} ${log.resourceId}` : ""}
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
