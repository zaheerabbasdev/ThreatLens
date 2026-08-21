import type { Indicator, MitreTechnique, RiskScore } from "@/types";
import type { SystemHealthMetric, ThreatActivityPoint } from "@/mocks/threatActivity";

export interface TopTechnique {
  technique: MitreTechnique;
  count: number;
}

/**
 * Threat intelligence & risk read-model used by the dashboard and (in later
 * increments) the threat-graph and MITRE browser pages. Backed today by
 * MockThreatService; a future provider-abstracted ApiThreatService replaces
 * it per spec §40/§41 without UI changes.
 */
export interface ThreatService {
  getOrgRiskScore(): Promise<RiskScore | null>;
  getRiskScoreById(id: string): Promise<RiskScore | null>;
  listTopIndicators(limit?: number): Promise<Indicator[]>;
  listActivityTimeline(): Promise<ThreatActivityPoint[]>;
  listTopTechniques(limit?: number): Promise<TopTechnique[]>;
  getSystemHealth(): Promise<SystemHealthMetric[]>;
  getIndicatorById(id: string): Promise<Indicator | null>;
  getIndicatorsByIds(ids: string[]): Promise<Indicator[]>;
  getTechniquesByIds(ids: string[]): Promise<MitreTechnique[]>;
}
