import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/Badge";
import { Icon } from "@/components/Icon";
import { useIncidentAIAnalysis } from "@/api/useAI";
import { formatDateTime } from "@/utils/format";
import styles from "./IncidentAIAnalysisSection.module.css";

export function IncidentAIAnalysisSection({ incidentId }: { incidentId: string }) {
  const { data: analysis, isLoading } = useIncidentAIAnalysis(incidentId);

  return (
    <Card className={styles.root}>
      <CardHeader>
        <CardTitle>
          <span className={styles.titleRow}>
            <Icon name="wand-magic-sparkles" size="sm" className={styles.titleIcon} />
            AI analysis
          </span>
        </CardTitle>
        <Badge tone="accent">AI-generated</Badge>
      </CardHeader>

      {isLoading ? (
        <Skeleton height={90} />
      ) : !analysis ? (
        <EmptyState
          icon="wand-magic-sparkles"
          title="No AI analysis for this incident"
          description="AI analysis hasn't been generated for this incident yet."
        />
      ) : (
        <>
          <p className={styles.summary}>{analysis.summary}</p>
          {analysis.keyFindings.length > 0 && (
            <ul className={styles.findings}>
              {analysis.keyFindings.map((finding, i) => (
                <li key={i} className={styles.finding}>
                  <Icon name="circle-dot" size="xs" className={styles.findingIcon} />
                  {finding}
                </li>
              ))}
            </ul>
          )}
          <div className={styles.footer}>
            <p className={styles.disclaimer}>{analysis.disclaimer}</p>
            <p className={styles.meta}>
              {analysis.modelLabel} · generated {formatDateTime(analysis.generatedAt)}
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
