import type { AIAnalysis } from "../types/ai.js";

/**
 * One analysis per incident, cached rather than regenerated on every read
 * (spec §60 cost control — re-analyzing on every page view would be a
 * silent way for "an accidental loop" to run up real API spend). `save`
 * overwrites any existing analysis for that incident — regenerating is an
 * explicit action (see ai.service.ts), not something that happens by
 * itself.
 */
export interface AIAnalysisRepository {
  getByIncident(organizationId: string, incidentId: string): Promise<AIAnalysis | null>;
  save(analysis: AIAnalysis): Promise<AIAnalysis>;
}

export class InMemoryAIAnalysisRepository implements AIAnalysisRepository {
  private readonly byIncidentId = new Map<string, AIAnalysis>();

  async getByIncident(organizationId: string, incidentId: string): Promise<AIAnalysis | null> {
    const analysis = this.byIncidentId.get(incidentId);
    if (!analysis || analysis.organizationId !== organizationId) return null;
    return { ...analysis };
  }

  async save(analysis: AIAnalysis): Promise<AIAnalysis> {
    this.byIncidentId.set(analysis.incidentId, analysis);
    return { ...analysis };
  }
}
