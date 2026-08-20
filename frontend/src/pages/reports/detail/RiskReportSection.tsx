import { RiskScoreCard } from "@/components/RiskScoreCard";
import { useOrgRiskScore } from "@/api/useDashboard";
import styles from "./ReportSection.module.css";

export function RiskReportSection() {
  const riskScore = useOrgRiskScore();

  return (
    <div className={styles.root}>
      <RiskScoreCard data={riskScore.data} loading={riskScore.isLoading} factorLimit={10} />
    </div>
  );
}
