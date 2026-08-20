import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "./Card";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { SeverityBadge } from "./SeverityBadge";
import { Icon } from "./Icon";
import { useIndicatorsByIds } from "@/api/useThreatIntel";
import { truncateMiddle } from "@/utils/format";
import { INDICATOR_TYPE_CONFIG } from "@/constants/indicatorType";
import styles from "./RelatedIndicatorsCard.module.css";

export interface RelatedIndicatorsCardProps {
  indicatorIds: string[];
  emptyDescription?: string;
}

export function RelatedIndicatorsCard({
  indicatorIds,
  emptyDescription = "No IOCs are associated with this record.",
}: RelatedIndicatorsCardProps) {
  const { data: indicators, isLoading } = useIndicatorsByIds(indicatorIds);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related indicators</CardTitle>
      </CardHeader>
      {indicatorIds.length === 0 ? (
        <EmptyState icon="shield-halved" title="No indicators linked" description={emptyDescription} />
      ) : isLoading ? (
        <div className={styles.list}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} height={20} />
          ))}
        </div>
      ) : (
        <ul className={styles.list}>
          {indicators?.map((indicator) => (
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
