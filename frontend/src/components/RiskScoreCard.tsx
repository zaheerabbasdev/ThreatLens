import { Card, CardHeader, CardTitle } from "./Card";
import { Skeleton } from "./Skeleton";
import { SeverityBadge } from "./SeverityBadge";
import { Tooltip } from "./Tooltip";
import { Icon } from "./Icon";
import type { RiskScore } from "@/types";
import { SEVERITY_HEX } from "@/constants/chartColors";
import styles from "./RiskScoreCard.module.css";

export interface RiskScoreCardProps {
  data?: RiskScore;
  loading?: boolean;
  title?: string;
  factorLimit?: number;
}

export function RiskScoreCard({
  data,
  loading,
  title = "Organizational risk score",
  factorLimit = 3,
}: RiskScoreCardProps) {
  return (
    <Card className={styles.root}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Tooltip content="Calculated deterministically from concrete factors below — never assigned by the AI layer.">
          <button type="button" className={styles.infoTrigger} aria-label="How this score is calculated">
            <Icon name="circle-info" size="sm" />
          </button>
        </Tooltip>
      </CardHeader>

      {loading || !data ? (
        <Skeleton height={110} />
      ) : (
        <>
          <div className={styles.scoreRow}>
            <span className={styles.scoreValue} style={{ color: SEVERITY_HEX[data.severity] }}>
              {data.value}
            </span>
            <SeverityBadge severity={data.severity} />
          </div>
          <ul className={styles.factors}>
            {data.factors.slice(0, factorLimit).map((factor) => (
              <li key={factor.label} className={styles.factor}>
                <span className={styles.factorLabel}>{factor.label}</span>
                <span className={styles.factorDescription}>{factor.description}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
