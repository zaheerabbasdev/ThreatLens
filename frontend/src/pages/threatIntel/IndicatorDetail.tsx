import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/Button";
import { AlertBanner } from "@/components/Alert";
import { RelatedIndicatorsCard } from "@/components/RelatedIndicatorsCard";
import { RelatedIncidentsCard } from "@/components/RelatedIncidentsCard";
import { useEnrichIOC, useIOC } from "@/api/useIOC";
import { formatShortId, truncateMiddle } from "@/utils/format";
import { IndicatorHeaderCard } from "./detail/IndicatorHeaderCard";
import { IndicatorTypeDetailsCard } from "./detail/IndicatorTypeDetailsCard";
import { IndicatorSourcesCard } from "./detail/IndicatorSourcesCard";
import { getRelatedIndicatorIds } from "./detail/indicatorHelpers";
import styles from "./IndicatorDetail.module.css";

export function IndicatorDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: indicator, isLoading, isError } = useIOC(id);
  const enrichIOC = useEnrichIOC();

  if (isLoading) {
    return (
      <div className={styles.root}>
        <Skeleton height={32} width="40%" />
        <Skeleton height={220} />
        <Skeleton height={200} />
      </div>
    );
  }

  if (isError || !indicator) {
    return (
      <EmptyState
        icon="shield-halved"
        title="Indicator not found"
        description="This indicator doesn't exist or may have been removed."
        action={
          <Link to="/app/threat-intel">
            <Button variant="secondary">Back to IOC Overview</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className={styles.root}>
      <PageHeader
        title={formatShortId(indicator.id)}
        breadcrumbs={[
          { label: "IOC Overview", path: "/app/threat-intel" },
          { label: truncateMiddle(indicator.value, 24) },
        ]}
        actions={
          <Button
            iconLeft="magnifying-glass-chart"
            loading={enrichIOC.isPending}
            onClick={() => id && enrichIOC.mutate({ id })}
          >
            {indicator.sources.length > 0 ? "Refresh enrichment" : "Enrich with VirusTotal"}
          </Button>
        }
      />

      {enrichIOC.isError && (
        <AlertBanner tone="danger" title="Enrichment failed">
          {enrichIOC.error instanceof Error ? enrichIOC.error.message : "VirusTotal could not analyze this indicator."}
        </AlertBanner>
      )}

      <IndicatorHeaderCard indicator={indicator} />

      <div className={styles.grid}>
        <div className={styles.column}>
          <IndicatorTypeDetailsCard indicator={indicator} />
          <IndicatorSourcesCard sources={indicator.sources} />
        </div>
        <div className={styles.column}>
          <RelatedIndicatorsCard
            indicatorIds={getRelatedIndicatorIds(indicator)}
            emptyDescription="No related IOCs have been correlated with this indicator."
          />
          <RelatedIncidentsCard
            incidentIds={indicator.relatedIncidentIds}
            emptyDescription="This indicator hasn't been linked to any incident."
          />
        </div>
      </div>
    </div>
  );
}
