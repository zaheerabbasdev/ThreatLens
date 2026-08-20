import { Card } from "@/components/Card";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Badge } from "@/components/Badge";
import { Icon } from "@/components/Icon";
import { CONFIDENCE_LABEL } from "@/constants/severity";
import { INDICATOR_TYPE_CONFIG } from "@/constants/indicatorType";
import { formatDateTime } from "@/utils/format";
import type { Indicator } from "@/types";
import styles from "./IndicatorHeaderCard.module.css";

export function IndicatorHeaderCard({ indicator }: { indicator: Indicator }) {
  return (
    <Card>
      <div className={styles.top}>
        <span className={styles.typeTag}>
          <Icon name={INDICATOR_TYPE_CONFIG[indicator.type].icon} size="sm" />
          {INDICATOR_TYPE_CONFIG[indicator.type].label}
        </span>
        <div className={styles.badgeRow}>
          <SeverityBadge severity={indicator.severity} />
          <Badge>{CONFIDENCE_LABEL[indicator.confidence]}</Badge>
          <Badge tone="accent">Risk {indicator.riskScore}</Badge>
        </div>
      </div>

      <h1 className={styles.value}>{indicator.value}</h1>

      {indicator.notes && <p className={styles.notes}>{indicator.notes}</p>}

      {indicator.tags.length > 0 && (
        <div className={styles.tags}>
          {indicator.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <span>First seen {formatDateTime(indicator.firstSeen)}</span>
        <span>Last seen {formatDateTime(indicator.lastSeen)}</span>
      </div>
    </Card>
  );
}
