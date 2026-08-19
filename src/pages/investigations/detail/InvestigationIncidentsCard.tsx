import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Icon } from "@/components/Icon";
import { EntityLinkPicker } from "@/components/EntityLinkPicker";
import { useIncidentsByIds, useIncidentsList } from "@/api/useIncidents";
import { useLinkIncident, useUnlinkIncident } from "@/api/useInvestigations";
import { usePermission } from "@/hooks/usePermission";
import { formatShortId, truncate } from "@/utils/format";
import styles from "./InvestigationIncidentsCard.module.css";

export function InvestigationIncidentsCard({
  investigationId,
  incidentIds,
}: {
  investigationId: string;
  incidentIds: string[];
}) {
  const canWrite = usePermission("investigations:write");
  const { data: incidents, isLoading } = useIncidentsByIds(incidentIds);
  const linkIncident = useLinkIncident(investigationId);
  const unlinkIncident = useUnlinkIncident(investigationId);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Gated on the picker actually being open — no reason to fetch a
  // candidate list before the analyst asks to link something.
  const { data: searchResults, isLoading: searching } = useIncidentsList(
    { search: search || undefined, pageSize: 8 },
    { enabled: pickerOpen },
  );
  const candidates = searchResults?.items.filter((i) => !incidentIds.includes(i.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked incidents</CardTitle>
      </CardHeader>

      {incidentIds.length === 0 ? (
        <EmptyState icon="fire" title="No incidents linked" description="Link an incident to start correlating evidence." />
      ) : isLoading ? (
        <div className={styles.list}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} height={20} />
          ))}
        </div>
      ) : (
        <ul className={styles.list}>
          {incidents?.map((incident) => (
            <li key={incident.id} className={styles.row}>
              <Link to={`/app/incidents/${incident.id}`} className={styles.rowLink}>
                <span className={styles.identity}>
                  <span className={styles.id}>{formatShortId(incident.id)}</span>
                  <span className={styles.title}>{truncate(incident.title, 48)}</span>
                </span>
                <SeverityBadge severity={incident.severity} size="sm" />
              </Link>
              {canWrite && (
                <button
                  type="button"
                  className={styles.unlinkButton}
                  onClick={() => unlinkIncident.mutate(incident.id)}
                  aria-label={`Unlink ${formatShortId(incident.id)}`}
                >
                  <Icon name="xmark" size="xs" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canWrite && (
        <div className={styles.picker}>
          <EntityLinkPicker
            triggerLabel="Link incident"
            searchPlaceholder="Search incidents by title…"
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            search={search}
            onSearchChange={setSearch}
            items={candidates}
            isLoading={searching}
            getId={(incident) => incident.id}
            onSelect={(incident) => linkIncident.mutate(incident.id)}
            emptyMessage="No matching incidents."
            renderItem={(incident) => (
              <span className={styles.candidateRow}>
                <span className={styles.id}>{formatShortId(incident.id)}</span>
                <span className={styles.title}>{truncate(incident.title, 40)}</span>
              </span>
            )}
          />
        </div>
      )}
    </Card>
  );
}
