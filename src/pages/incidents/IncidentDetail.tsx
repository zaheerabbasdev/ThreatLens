import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { RiskScoreCard } from "@/components/RiskScoreCard";
import { Timeline } from "@/components/Timeline";
import { Button } from "@/components/Button";
import { useIncident } from "@/api/useIncidents";
import { useRiskScore } from "@/api/useThreatIntel";
import { formatShortId } from "@/utils/format";
import { IncidentHeaderCard } from "./detail/IncidentHeaderCard";
import { IncidentEvidence } from "./detail/IncidentEvidence";
import { IncidentBehavioral } from "./detail/IncidentBehavioral";
import { IncidentAIAnalysisSection } from "./detail/IncidentAIAnalysisSection";
import { IncidentRecommendations } from "./detail/IncidentRecommendations";
import { IncidentNotes } from "./detail/IncidentNotes";
import { RelatedIndicatorsCard } from "@/components/RelatedIndicatorsCard";
import { IncidentMitreCard } from "./detail/IncidentMitreCard";
import { IncidentAuditHistoryCard } from "./detail/IncidentAuditHistoryCard";
import styles from "./IncidentDetail.module.css";

export function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: incident, isLoading, isError } = useIncident(id);
  const { data: riskScore, isLoading: riskLoading } = useRiskScore(incident?.riskScoreId);

  if (isLoading) {
    return (
      <div className={styles.root}>
        <Skeleton height={32} width="40%" />
        <Skeleton height={220} />
        <Skeleton height={300} />
      </div>
    );
  }

  if (isError || !incident) {
    return (
      <EmptyState
        icon="fire"
        title="Incident not found"
        description="This incident doesn't exist or may have been removed."
        action={
          <Link to="/app/incidents">
            <Button variant="secondary">Back to Incidents</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className={styles.root}>
      <PageHeader
        title={formatShortId(incident.id)}
        breadcrumbs={[
          { label: "Incidents", path: "/app/incidents" },
          { label: formatShortId(incident.id) },
        ]}
      />

      <IncidentHeaderCard incident={incident} />

      <div className={styles.grid}>
        <div className={styles.main}>
          <Timeline
            events={incident.timeline}
            emptyDescription="Events will appear here as the incident progresses."
          />
          <IncidentEvidence evidence={incident.evidence} />
          <IncidentBehavioral findings={incident.behavioralFindings} />
          <IncidentAIAnalysisSection incidentId={incident.id} />
          <IncidentRecommendations incidentId={incident.id} />
          <IncidentNotes incidentId={incident.id} notes={incident.notes} />
        </div>
        <div className={styles.side}>
          <RiskScoreCard data={riskScore ?? undefined} loading={riskLoading} title="Incident risk score" />
          <RelatedIndicatorsCard
            indicatorIds={incident.indicatorIds}
            emptyDescription="No IOCs are associated with this incident."
          />
          <IncidentMitreCard techniqueIds={incident.mitreTechniqueIds} />
          <IncidentAuditHistoryCard incidentId={incident.id} />
        </div>
      </div>
    </div>
  );
}
