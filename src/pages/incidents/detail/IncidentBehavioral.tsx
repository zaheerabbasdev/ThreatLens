import { Card, CardHeader, CardTitle } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import type { BehavioralFinding } from "@/types";
import styles from "./IncidentBehavioral.module.css";

export function IncidentBehavioral({ findings }: { findings: BehavioralFinding[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Behavioral analysis</CardTitle>
      </CardHeader>
      {findings.length === 0 ? (
        <EmptyState
          icon="gauge-high"
          title="No behavioral anomalies detected"
          description="Nothing in this incident deviates from the established baseline."
        />
      ) : (
        <ul className={styles.list}>
          {findings.map((finding) => (
            <li key={finding.id} className={styles.item}>
              <div className={styles.header}>
                <p className={styles.label}>{finding.label}</p>
                <span className={styles.score}>{finding.anomalyScore}/100 anomaly</span>
              </div>
              <div className={styles.track}>
                <div className={styles.fill} style={{ width: `${finding.anomalyScore}%` }} />
              </div>
              <div className={styles.compare}>
                <div>
                  <p className={styles.compareLabel}>Normal behavior</p>
                  <p className={styles.compareText}>{finding.normalBehavior}</p>
                </div>
                <div>
                  <p className={styles.compareLabel}>Observed behavior</p>
                  <p className={styles.compareText}>{finding.observedBehavior}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
