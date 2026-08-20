import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "./Card";
import { Skeleton } from "./Skeleton";
import { EmptyState } from "./EmptyState";
import { SeverityBadge } from "./SeverityBadge";
import { useIncidentsByIds } from "@/api/useIncidents";
import { formatShortId } from "@/utils/format";
import styles from "./RelatedIncidentsCard.module.css";

export interface RelatedIncidentsCardProps {
  incidentIds: string[];
  emptyDescription?: string;
}

export function RelatedIncidentsCard({
  incidentIds,
  emptyDescription = "No incidents are associated with this record.",
}: RelatedIncidentsCardProps) {
  const { data: incidents, isLoading } = useIncidentsByIds(incidentIds);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related incidents</CardTitle>
      </CardHeader>
      {incidentIds.length === 0 ? (
        <EmptyState icon="fire" title="No incidents linked" description={emptyDescription} />
      ) : isLoading ? (
        <div className={styles.list}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} height={20} />
          ))}
        </div>
      ) : (
        <ul className={styles.list}>
          {incidents?.map((incident) => (
            <li key={incident.id}>
              <Link to={`/app/incidents/${incident.id}`} className={styles.row}>
                <span className={styles.identity}>
                  <span className={styles.idTag}>{formatShortId(incident.id)}</span>
                  <span className={styles.title} title={incident.title}>
                    {incident.title}
                  </span>
                </span>
                <SeverityBadge severity={incident.severity} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
