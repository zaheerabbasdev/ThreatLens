import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Icon } from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { RelatedIndicatorsCard } from "@/components/RelatedIndicatorsCard";
import { RelatedIncidentsCard } from "@/components/RelatedIncidentsCard";
import { useMitreTactics, useMitreTechnique, useMitreTechniques } from "@/api/useMitre";
import styles from "./MitreTechniqueDetail.module.css";

export function MitreTechniqueDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: technique, isLoading, isError } = useMitreTechnique(id);
  const { data: tactics } = useMitreTactics();
  const { data: allTechniques } = useMitreTechniques({});

  if (isLoading) {
    return (
      <div className={styles.root}>
        <Skeleton height={32} width="30%" />
        <Skeleton height={200} />
      </div>
    );
  }

  if (isError || !technique) {
    return (
      <EmptyState
        icon="chess-board"
        title="Technique not found"
        description="This ATT&CK technique doesn't exist or may have been removed."
        action={
          <Link to="/app/mitre">
            <Button variant="secondary">Back to MITRE ATT&CK</Button>
          </Link>
        }
      />
    );
  }

  const parent = technique.isSubTechnique
    ? allTechniques?.find((t) => t.id === technique.parentTechniqueId)
    : undefined;
  const subTechniques = allTechniques?.filter((t) => t.parentTechniqueId === technique.id) ?? [];
  const tacticNames = technique.tacticIds
    .map((tid) => tactics?.find((t) => t.id === tid)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <div className={styles.root}>
      <PageHeader
        title={technique.id}
        breadcrumbs={[{ label: "MITRE ATT&CK", path: "/app/mitre" }, { label: technique.id }]}
      />

      <Card>
        <div className={styles.top}>
          <span className={styles.techId}>{technique.id}</span>
          {technique.isSubTechnique && <Badge tone="neutral">Sub-technique</Badge>}
        </div>
        <h1 className={styles.name}>{technique.name}</h1>
        <p className={styles.description}>{technique.description}</p>

        {tacticNames.length > 0 && (
          <div className={styles.tactics}>
            {tacticNames.map((name) => (
              <span key={name} className={styles.tacticBadge}>
                {name}
              </span>
            ))}
          </div>
        )}

        {parent && (
          <div className={styles.relatedRow}>
            <span className={styles.relatedLabel}>Parent technique</span>
            <Link to={`/app/mitre/${parent.id}`} className={styles.relatedLink}>
              {parent.id} — {parent.name}
            </Link>
          </div>
        )}

        {subTechniques.length > 0 && (
          <div className={styles.relatedRow}>
            <span className={styles.relatedLabel}>Sub-techniques</span>
            <div className={styles.subTechniqueList}>
              {subTechniques.map((sub) => (
                <Link key={sub.id} to={`/app/mitre/${sub.id}`} className={styles.relatedLink}>
                  <Icon name="chevron-right" size="xs" />
                  {sub.id} — {sub.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className={styles.grid}>
        <RelatedIncidentsCard
          incidentIds={technique.mappedIncidentIds}
          emptyDescription="No incidents have been mapped to this technique yet."
        />
        <RelatedIndicatorsCard
          indicatorIds={technique.mappedIndicatorIds}
          emptyDescription="No indicators have been mapped to this technique yet."
        />
      </div>
    </div>
  );
}
