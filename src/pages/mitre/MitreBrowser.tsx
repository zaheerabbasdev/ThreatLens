import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/Input";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Icon } from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { AlertBanner } from "@/components/Alert";
import { useMitreTactics, useMitreTechniques } from "@/api/useMitre";
import { cn } from "@/utils/cn";
import styles from "./MitreBrowser.module.css";

export function MitreBrowser() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tacticId, setTacticId] = useState<string | null>(null);

  const { data: tactics, isLoading: tacticsLoading } = useMitreTactics();
  const {
    data: techniques,
    isLoading: techniquesLoading,
    isError,
  } = useMitreTechniques({ tacticId: tacticId ?? undefined, search: search || undefined });

  const tacticById = new Map((tactics ?? []).map((t) => [t.id, t]));

  return (
    <div className={styles.root}>
      <PageHeader
        title="MITRE ATT&CK"
        subtitle="Adversary tactics and techniques observed or mapped across your environment."
      />

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Input
            label="Search techniques"
            hideLabel
            iconLeft="magnifying-glass"
            placeholder="Search by technique ID or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tacticRow} role="group" aria-label="Filter by tactic">
        <button
          type="button"
          className={cn(styles.tacticChip, tacticId === null && styles.tacticChipActive)}
          aria-pressed={tacticId === null}
          onClick={() => setTacticId(null)}
        >
          All tactics
        </button>
        {tacticsLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={30} width={110} radius="pill" />)
          : tactics?.map((tactic) => (
              <button
                key={tactic.id}
                type="button"
                className={cn(styles.tacticChip, tacticId === tactic.id && styles.tacticChipActive)}
                aria-pressed={tacticId === tactic.id}
                onClick={() => setTacticId(tactic.id)}
                title={tactic.description}
              >
                {tactic.name}
              </button>
            ))}
      </div>

      {isError ? (
        <AlertBanner tone="danger" title="Couldn't load ATT&CK techniques">
          Something went wrong fetching technique data. Try again in a moment.
        </AlertBanner>
      ) : techniquesLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={130} radius="lg" />
          ))}
        </div>
      ) : !techniques || techniques.length === 0 ? (
        <EmptyState
          icon="chess-board"
          title="No techniques match these filters"
          description="Try a different tactic or search term."
        />
      ) : (
        <div className={styles.grid}>
          {techniques.map((technique) => (
            <Card
              key={technique.id}
              interactive
              onClick={() => navigate(`/app/mitre/${technique.id}`)}
              className={styles.card}
            >
              <div className={styles.cardHeader}>
                <span className={styles.techId}>{technique.id}</span>
                {technique.isSubTechnique && <Badge tone="neutral">Sub-technique</Badge>}
              </div>
              <h2 className={styles.techName}>{technique.name}</h2>
              <p className={styles.techDescription}>{technique.description}</p>
              <div className={styles.cardFooter}>
                <div className={styles.tacticBadges}>
                  {technique.tacticIds.map((id) => {
                    const tactic = tacticById.get(id);
                    return tactic ? (
                      <span key={id} className={styles.tacticBadge}>
                        {tactic.name}
                      </span>
                    ) : null;
                  })}
                </div>
                <div className={styles.counts}>
                  <span className={styles.countItem}>
                    <Icon name="fire" size="xs" />
                    {technique.mappedIncidentIds.length}
                  </span>
                  <span className={styles.countItem}>
                    <Icon name="shield-halved" size="xs" />
                    {technique.mappedIndicatorIds.length}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
