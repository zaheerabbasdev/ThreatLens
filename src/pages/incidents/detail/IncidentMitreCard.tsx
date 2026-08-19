import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Tooltip } from "@/components/Tooltip";
import { useTechniquesByIds } from "@/api/useThreatIntel";
import styles from "./IncidentMitreCard.module.css";

export function IncidentMitreCard({ techniqueIds }: { techniqueIds: string[] }) {
  const { data: techniques, isLoading } = useTechniquesByIds(techniqueIds);

  return (
    <Card>
      <CardHeader>
        <CardTitle>MITRE ATT&amp;CK techniques</CardTitle>
      </CardHeader>
      {techniqueIds.length === 0 ? (
        <EmptyState icon="chess-board" title="No techniques mapped" description="No ATT&CK techniques are mapped to this incident." />
      ) : isLoading ? (
        <div className={styles.list}>
          <Skeleton height={28} width="60%" />
          <Skeleton height={28} width="80%" />
        </div>
      ) : (
        <div className={styles.list}>
          {techniques?.map((technique) => (
            <Tooltip key={technique.id} content={technique.description} side="top">
              <button type="button" className={styles.chip}>
                <span className={styles.chipId}>{technique.id}</span>
                {technique.name}
              </button>
            </Tooltip>
          ))}
        </div>
      )}
    </Card>
  );
}
