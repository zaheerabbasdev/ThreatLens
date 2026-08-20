import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { Timeline } from "@/components/Timeline";
import { Button } from "@/components/Button";
import { useInvestigation } from "@/api/useInvestigations";
import { formatShortId } from "@/utils/format";
import { InvestigationHeaderCard } from "./detail/InvestigationHeaderCard";
import { InvestigationIncidentsCard } from "./detail/InvestigationIncidentsCard";
import { InvestigationIndicatorsCard } from "./detail/InvestigationIndicatorsCard";
import { InvestigationNotes } from "./detail/InvestigationNotes";
import styles from "./InvestigationDetail.module.css";

export function InvestigationDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: investigation, isLoading, isError } = useInvestigation(id);

  if (isLoading) {
    return (
      <div className={styles.root}>
        <Skeleton height={32} width="40%" />
        <Skeleton height={200} />
        <Skeleton height={280} />
      </div>
    );
  }

  if (isError || !investigation) {
    return (
      <EmptyState
        icon="magnifying-glass"
        title="Investigation not found"
        description="This investigation doesn't exist or may have been removed."
        action={
          <Link to="/app/investigations">
            <Button variant="secondary">Back to Investigations</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className={styles.root}>
      <PageHeader
        title={formatShortId(investigation.id)}
        breadcrumbs={[
          { label: "Investigations", path: "/app/investigations" },
          { label: formatShortId(investigation.id) },
        ]}
      />

      <InvestigationHeaderCard investigation={investigation} />

      <div className={styles.grid}>
        <div className={styles.main}>
          <Timeline
            events={investigation.timeline}
            emptyDescription="Linking evidence and adding findings will build this timeline."
          />
          <InvestigationNotes investigationId={investigation.id} notes={investigation.notes} />
        </div>
        <div className={styles.side}>
          <InvestigationIncidentsCard
            investigationId={investigation.id}
            incidentIds={investigation.relatedIncidentIds}
          />
          <InvestigationIndicatorsCard
            investigationId={investigation.id}
            indicatorIds={investigation.relatedIndicatorIds}
          />
        </div>
      </div>
    </div>
  );
}
