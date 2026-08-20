import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { Icon } from "@/components/Icon";
import type { SystemHealthMetric } from "@/mocks/threatActivity";
import { cn } from "@/utils/cn";
import styles from "./SystemHealthPanel.module.css";

const STATUS_CONFIG = {
  operational: { label: "Operational", className: styles.operational, icon: "circle-check" as const },
  degraded: { label: "Degraded", className: styles.degraded, icon: "triangle-exclamation" as const },
  outage: { label: "Outage", className: styles.outage, icon: "circle-xmark" as const },
};

export function SystemHealthPanel({
  data,
  loading,
}: {
  data?: SystemHealthMetric[];
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System status</CardTitle>
      </CardHeader>
      <div className={styles.list}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={20} />)
          : data?.map((metric) => {
              const config = STATUS_CONFIG[metric.status];
              return (
                <div key={metric.label} className={styles.row}>
                  <span className={styles.metricLabel}>{metric.label}</span>
                  <span className={cn(styles.status, config.className)}>
                    <Icon name={config.icon} size="xs" />
                    {config.label}
                  </span>
                </div>
              );
            })}
      </div>
    </Card>
  );
}
