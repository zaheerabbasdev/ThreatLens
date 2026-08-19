import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { SEVERITY_CONFIG, SEVERITY_ORDER } from "@/constants/severity";
import { Icon } from "@/components/Icon";
import type { Severity } from "@/types";
import styles from "./SeverityDistributionCard.module.css";

export interface SeverityDistributionCardProps {
  bySeverity?: Record<Severity, number>;
  loading?: boolean;
}

export function SeverityDistributionCard({ bySeverity, loading }: SeverityDistributionCardProps) {
  const total = bySeverity ? Object.values(bySeverity).reduce((sum, n) => sum + n, 0) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Incidents by severity</CardTitle>
      </CardHeader>

      {loading || !bySeverity ? (
        <Skeleton height={140} />
      ) : (
        <ul className={styles.list}>
          {SEVERITY_ORDER.map((severity) => {
            const count = bySeverity[severity];
            const config = SEVERITY_CONFIG[severity];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <li key={severity} className={styles.row}>
                <span className={styles.label} style={{ color: config.colorVar }}>
                  <Icon name={config.iconName} size="xs" />
                  {config.label}
                </span>
                <div className={styles.track}>
                  <div
                    className={styles.fill}
                    style={{ width: `${pct}%`, background: config.colorVar }}
                  />
                </div>
                <span className={styles.count}>{count}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
