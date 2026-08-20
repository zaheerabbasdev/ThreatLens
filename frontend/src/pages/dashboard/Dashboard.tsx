import { StatTile } from "@/components/StatTile";
import { useAuth } from "@/hooks/useAuth";
import {
  useAlertSummary,
  useIncidentSummary,
  useOrgRiskScore,
  useSystemHealth,
  useThreatActivityTimeline,
  useTopIndicators,
  useTopTechniques,
} from "@/api/useDashboard";
import { RiskScoreCard } from "@/components/RiskScoreCard";
import { ThreatActivityChart } from "./ThreatActivityChart";
import { SystemHealthPanel } from "./SystemHealthPanel";
import { TopIndicatorsCard } from "@/components/TopIndicatorsCard";
import { TopTechniquesCard } from "@/components/TopTechniquesCard";
import { SeverityDistributionCard } from "./SeverityDistributionCard";
import styles from "./Dashboard.module.css";

export function Dashboard() {
  const { user } = useAuth();
  const incidentSummary = useIncidentSummary();
  const alertSummary = useAlertSummary();
  const riskScore = useOrgRiskScore();
  const activity = useThreatActivityTimeline();
  const topIndicators = useTopIndicators(5);
  const topTechniques = useTopTechniques(5);
  const systemHealth = useSystemHealth();

  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome back, {firstName}</h1>
        <p className={styles.subtitle}>Here's your organization's current security posture.</p>
      </div>

      <div className={styles.statGrid}>
        <StatTile
          label="Open incidents"
          value={incidentSummary.data?.open}
          icon="fire"
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
        <StatTile
          label="Critical incidents"
          value={incidentSummary.data?.bySeverity.critical}
          icon="skull-crossbones"
          tone="danger"
          loading={incidentSummary.isLoading}
        />
        <StatTile
          label="Total indicators tracked"
          value={topIndicators.data?.length}
          icon="shield-halved"
          tone="accent"
          loading={topIndicators.isLoading}
        />
      </div>

      <div className={styles.mainGrid}>
        <RiskScoreCard data={riskScore.data} loading={riskScore.isLoading} />
        <SeverityDistributionCard
          bySeverity={incidentSummary.data?.bySeverity}
          loading={incidentSummary.isLoading}
        />
      </div>

      <div className={styles.activityGrid}>
        <ThreatActivityChart data={activity.data} loading={activity.isLoading} />
        <SystemHealthPanel data={systemHealth.data} loading={systemHealth.isLoading} />
      </div>

      <div className={styles.listGrid}>
        <TopIndicatorsCard data={topIndicators.data} loading={topIndicators.isLoading} />
        <TopTechniquesCard data={topTechniques.data} loading={topTechniques.isLoading} />
      </div>
    </div>
  );
}
