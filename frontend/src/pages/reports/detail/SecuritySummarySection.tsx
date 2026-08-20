import { StatTile } from "@/components/StatTile";
import { RiskScoreCard } from "@/components/RiskScoreCard";
import { useAlertSummary, useIncidentSummary, useOrgRiskScore } from "@/api/useDashboard";
import styles from "./ReportSection.module.css";

export function SecuritySummarySection() {
  const incidentSummary = useIncidentSummary();
  const alertSummary = useAlertSummary();
  const riskScore = useOrgRiskScore();

  return (
    <div className={styles.root}>
      <div className={styles.statGrid}>
        <StatTile
          label="Open incidents"
          value={incidentSummary.data?.open}
          icon="fire"
          tone="danger"
          loading={incidentSummary.isLoading}
        />
        <StatTile
          label="Critical incidents"
          value={incidentSummary.data?.bySeverity.critical}
          icon="skull-crossbones"
          tone="danger"
          loading={incidentSummary.isLoading}
        />
        <StatTile
          label="Unresolved alerts"
          value={alertSummary.data?.unresolved}
          icon="bell"
          tone="warning"
          loading={alertSummary.isLoading}
        />
      </div>
      <RiskScoreCard data={riskScore.data} loading={riskScore.isLoading} factorLimit={5} />
    </div>
  );
}
