import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Icon } from "@/components/Icon";
import { EntityLinkPicker } from "@/components/EntityLinkPicker";
import { useIndicatorsByIds } from "@/api/useThreatIntel";
import { useIOCList } from "@/api/useIOC";
import { useLinkIndicator, useUnlinkIndicator } from "@/api/useInvestigations";
import { usePermission } from "@/hooks/usePermission";
import { INDICATOR_TYPE_CONFIG } from "@/constants/indicatorType";
import { truncateMiddle } from "@/utils/format";
import styles from "./InvestigationIncidentsCard.module.css";

export function InvestigationIndicatorsCard({
  investigationId,
  indicatorIds,
}: {
  investigationId: string;
  indicatorIds: string[];
}) {
  const canWrite = usePermission("investigations:write");
  const { data: indicators, isLoading } = useIndicatorsByIds(indicatorIds);
  const linkIndicator = useLinkIndicator(investigationId);
  const unlinkIndicator = useUnlinkIndicator(investigationId);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Gated on the picker actually being open — no reason to fetch a
  // candidate list before the analyst asks to link something.
  const { data: searchResults, isLoading: searching } = useIOCList(
    { search: search || undefined, pageSize: 8 },
    { enabled: pickerOpen },
  );
  const candidates = searchResults?.items.filter((i) => !indicatorIds.includes(i.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked indicators</CardTitle>
      </CardHeader>

      {indicatorIds.length === 0 ? (
        <EmptyState icon="shield-halved" title="No indicators linked" description="Link an IOC to track it as part of this case." />
      ) : isLoading ? (
        <div className={styles.list}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} height={20} />
          ))}
        </div>
      ) : (
        <ul className={styles.list}>
          {indicators?.map((indicator) => (
            <li key={indicator.id} className={styles.row}>
              <Link to={`/app/threat-intel/${indicator.id}`} className={styles.rowLink}>
                <span className={styles.identity}>
                  <Icon name={INDICATOR_TYPE_CONFIG[indicator.type].icon} size="sm" />
                  <span className={styles.title}>{truncateMiddle(indicator.value, 20)}</span>
                </span>
                <SeverityBadge severity={indicator.severity} size="sm" />
              </Link>
              {canWrite && (
                <button
                  type="button"
                  className={styles.unlinkButton}
                  onClick={() => unlinkIndicator.mutate(indicator.id)}
                  aria-label={`Unlink ${indicator.value}`}
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
            triggerLabel="Link indicator"
            searchPlaceholder="Search indicators by value…"
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            search={search}
            onSearchChange={setSearch}
            items={candidates}
            isLoading={searching}
            getId={(indicator) => indicator.id}
            onSelect={(indicator) => linkIndicator.mutate(indicator.id)}
            emptyMessage="No matching indicators."
            renderItem={(indicator) => (
              <span className={styles.candidateRow}>
                <Icon name={INDICATOR_TYPE_CONFIG[indicator.type].icon} size="sm" />
                <span className={styles.title}>{truncateMiddle(indicator.value, 32)}</span>
              </span>
            )}
          />
        </div>
      )}
    </Card>
  );
}
