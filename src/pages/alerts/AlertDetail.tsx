import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/Button";
import { RelatedIndicatorsCard } from "@/components/RelatedIndicatorsCard";
import { useAlert } from "@/api/useAlerts";
import { formatShortId } from "@/utils/format";
import { AlertHeaderCard } from "./detail/AlertHeaderCard";
import styles from "./AlertDetail.module.css";

export function AlertDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: alert, isLoading, isError } = useAlert(id);

  if (isLoading) {
    return (
      <div className={styles.root}>
        <Skeleton height={32} width="40%" />
        <Skeleton height={220} />
      </div>
    );
  }

  if (isError || !alert) {
    return (
      <EmptyState
        icon="bell"
        title="Alert not found"
        description="This alert doesn't exist or may have been removed."
        action={
          <Link to="/app/alerts">
            <Button variant="secondary">Back to Alerts</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className={styles.root}>
      <PageHeader
        title={formatShortId(alert.id)}
        breadcrumbs={[{ label: "Alerts", path: "/app/alerts" }, { label: formatShortId(alert.id) }]}
      />

      <AlertHeaderCard alert={alert} />

      <RelatedIndicatorsCard
        indicatorIds={alert.relatedIndicatorIds}
        emptyDescription="No IOCs are associated with this alert."
      />
    </div>
  );
}
