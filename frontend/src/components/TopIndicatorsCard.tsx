import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Icon } from "@/components/Icon";
import type { Indicator } from "@/types";
import { truncateMiddle } from "@/utils/format";
import { INDICATOR_TYPE_CONFIG } from "@/constants/indicatorType";
import styles from "./TopIndicatorsCard.module.css";

export function TopIndicatorsCard({ data, loading }: { data?: Indicator[]; loading?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Highest-risk indicators</CardTitle>
        <Link to="/app/threat-intel" className={styles.viewAll}>
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
        <EmptyState icon="shield-halved" title="No indicators yet" description="Submitted IOCs will appear here once analyzed." />
      ) : (
        <ul className={styles.list}>
          {data.map((indicator) => (
            <li key={indicator.id}>
              <Link to={`/app/threat-intel/${indicator.id}`} className={styles.row}>
                <span className={styles.identity}>
                  <Icon name={INDICATOR_TYPE_CONFIG[indicator.type].icon} size="sm" className={styles.typeIcon} />
                  <span className={styles.value} title={indicator.value}>
                    {truncateMiddle(indicator.value, 14)}
                  </span>
                </span>
                <SeverityBadge severity={indicator.severity} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
