import type { Recommendation, RecommendationStatus } from "../types/ai.js";

/** Same tenant-isolation contract as IncidentRepository — see its comment. */
export interface RecommendationRepository {
  create(recommendation: Recommendation): Promise<Recommendation>;
  listByIncident(organizationId: string, incidentId: string): Promise<Recommendation[]>;
  getById(organizationId: string, id: string): Promise<Recommendation | null>;
  review(
    organizationId: string,
    id: string,
    status: Exclude<RecommendationStatus, "pending" | "applied">,
    reviewerId: string,
  ): Promise<Recommendation | null>;
}

export class InMemoryRecommendationRepository implements RecommendationRepository {
  private readonly recommendationsById = new Map<string, Recommendation>();

  async create(recommendation: Recommendation): Promise<Recommendation> {
    this.recommendationsById.set(recommendation.id, recommendation);
    return { ...recommendation };
  }

  async listByIncident(organizationId: string, incidentId: string): Promise<Recommendation[]> {
    return [...this.recommendationsById.values()].filter(
      (r) => r.organizationId === organizationId && r.incidentId === incidentId,
    );
  }

  async getById(organizationId: string, id: string): Promise<Recommendation | null> {
    const rec = this.recommendationsById.get(id);
    if (!rec || rec.organizationId !== organizationId) return null;
    return { ...rec };
  }

  async review(
    organizationId: string,
    id: string,
    status: Exclude<RecommendationStatus, "pending" | "applied">,
    reviewerId: string,
  ): Promise<Recommendation | null> {
    const existing = this.recommendationsById.get(id);
    if (!existing || existing.organizationId !== organizationId) return null;
    const updated: Recommendation = { ...existing, status, reviewedBy: reviewerId, reviewedAt: new Date().toISOString() };
    this.recommendationsById.set(id, updated);
    return { ...updated };
  }
}
