import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import type { TopTechnique } from "@/services/threat.service";
import styles from "./TopTechniquesCard.module.css";

export function TopTechniquesCard({ data, loading }: { data?: TopTechnique[]; loading?: boolean }) {
  const maxCount = data && data.length > 0 ? Math.max(...data.map((d) => d.count)) : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top ATT&amp;CK techniques</CardTitle>
        <Link to="/app/mitre" className={styles.viewAll}>
          View all
          <Icon name="arrow-right" size="xs" />
        </Link>
      </CardHeader>

      {loading ? (
        <div className={styles.list}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={20} />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon="chess-board" title="No techniques mapped" description="Technique mappings will appear as incidents are analyzed." />
      ) : (
        <ul className={styles.list}>
          {data.map((item) => (
            <li key={item.technique.id} className={styles.row}>
              <div className={styles.labelRow}>
                <span className={styles.techId}>{item.technique.id}</span>
                <span className={styles.techName}>{item.technique.name}</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${Math.max(6, (item.count / maxCount) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
