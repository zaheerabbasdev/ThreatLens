import { Card, CardHeader, CardTitle } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/Badge";
import { CONFIDENCE_LABEL } from "@/constants/severity";
import { formatDateTime } from "@/utils/format";
import type { DataSource } from "@/types";
import styles from "./IndicatorSourcesCard.module.css";

/** Displays source/timestamp/confidence per finding — never presents external
 * intelligence as absolute truth (spec §40). */
export function IndicatorSourcesCard({ sources }: { sources: DataSource[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sources</CardTitle>
      </CardHeader>
      {sources.length === 0 ? (
        <EmptyState icon="server" title="No sources recorded" description="This indicator hasn't been corroborated by any source yet." />
      ) : (
        <ul className={styles.list}>
          {sources.map((source, i) => (
            <li key={i} className={styles.item}>
              <div>
                <p className={styles.provider}>{source.provider}</p>
                <p className={styles.time}>{formatDateTime(source.fetchedAt)}</p>
              </div>
              <Badge>{CONFIDENCE_LABEL[source.confidence]}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
