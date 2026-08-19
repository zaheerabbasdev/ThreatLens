import { Card, CardHeader, CardTitle } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { formatDateTime } from "@/utils/format";
import type { IncidentEvidence as IncidentEvidenceItem } from "@/types";
import styles from "./IncidentEvidence.module.css";

export function IncidentEvidence({ evidence }: { evidence: IncidentEvidenceItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence</CardTitle>
      </CardHeader>
      {evidence.length === 0 ? (
        <EmptyState icon="folder-open" title="No evidence collected yet" description="Supporting evidence for this incident will appear here." />
      ) : (
        <ul className={styles.list}>
          {evidence.map((item) => (
            <li key={item.id} className={styles.item}>
              <span className={styles.icon}>
                <Icon name="folder-open" size="sm" />
              </span>
              <div className={styles.content}>
                <p className={styles.label}>{item.label}</p>
                <p className={styles.description}>{item.description}</p>
                <p className={styles.meta}>Collected {formatDateTime(item.collectedAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
