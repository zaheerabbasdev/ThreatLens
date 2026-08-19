import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { useIncidentRecommendations, useReviewRecommendation } from "@/api/useAI";
import { usePermission } from "@/hooks/usePermission";
import type { Recommendation, RecommendationStatus } from "@/types";
import styles from "./IncidentRecommendations.module.css";

const STATUS_TONE: Record<RecommendationStatus, "neutral" | "success" | "danger" | "accent"> = {
  pending: "neutral",
  approved: "success",
  rejected: "danger",
  applied: "accent",
};

const STATUS_LABEL: Record<RecommendationStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  applied: "Applied",
};

export function IncidentRecommendations({ incidentId }: { incidentId: string }) {
  const { data: recommendations, isLoading } = useIncidentRecommendations(incidentId);
  const review = useReviewRecommendation(incidentId);
  const canApprove = usePermission("recommendations:approve");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended actions</CardTitle>
        <Badge tone="accent">AI-suggested</Badge>
      </CardHeader>

      {isLoading ? (
        <Skeleton height={80} />
      ) : !recommendations || recommendations.length === 0 ? (
        <EmptyState
          icon="lightbulb"
          title="No recommendations yet"
          description="The AI assistant hasn't suggested any response actions for this incident."
        />
      ) : (
        <ul className={styles.list}>
          {recommendations.map((rec: Recommendation) => (
            <li key={rec.id} className={styles.item}>
              <div className={styles.itemHeader}>
                <p className={styles.itemTitle}>{rec.title}</p>
                <Badge tone={STATUS_TONE[rec.status]}>{STATUS_LABEL[rec.status]}</Badge>
              </div>
              <p className={styles.itemDescription}>{rec.description}</p>
              {rec.status === "pending" && canApprove && (
                <div className={styles.actions}>
                  <Button
                    size="sm"
                    variant="secondary"
                    iconLeft="check"
                    loading={review.isPending && review.variables?.recommendationId === rec.id}
                    onClick={() => review.mutate({ recommendationId: rec.id, status: "approved" })}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    iconLeft="xmark"
                    loading={review.isPending && review.variables?.recommendationId === rec.id}
                    onClick={() => review.mutate({ recommendationId: rec.id, status: "rejected" })}
                  >
                    Reject
                  </Button>
                </div>
              )}
              {rec.status === "pending" && !canApprove && (
                <p className={styles.permissionNote}>
                  <Icon name="lock" size="xs" /> Your role can't approve recommendations.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
