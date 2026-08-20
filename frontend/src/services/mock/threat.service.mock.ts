import type { ThreatService, TopTechnique } from "@/services/threat.service";
import type { Indicator, MitreTechnique, RiskScore } from "@/types";
import { MOCK_INDICATORS } from "@/mocks/indicators";
import { MOCK_TECHNIQUES } from "@/mocks/mitre";
import { MOCK_RISK_SCORES } from "@/mocks/riskScores";
import { MOCK_SYSTEM_HEALTH, MOCK_THREAT_ACTIVITY, type SystemHealthMetric, type ThreatActivityPoint } from "@/mocks/threatActivity";
import { delay } from "./util";

export class MockThreatService implements ThreatService {
  async getOrgRiskScore(): Promise<RiskScore> {
    return delay(MOCK_RISK_SCORES.org_overall!, 300);
  }

  async getRiskScoreById(id: string): Promise<RiskScore | null> {
    await delay(undefined, 250);
    return MOCK_RISK_SCORES[id] ?? null;
  }

  async listTopIndicators(limit = 5): Promise<Indicator[]> {
    const sorted = [...MOCK_INDICATORS].sort((a, b) => b.riskScore - a.riskScore);
    return delay(sorted.slice(0, limit), 350);
  }

  async listActivityTimeline(): Promise<ThreatActivityPoint[]> {
    return delay(MOCK_THREAT_ACTIVITY, 350);
  }

  async listTopTechniques(limit = 5): Promise<TopTechnique[]> {
    const ranked = MOCK_TECHNIQUES.map((technique) => ({
      technique,
      count: technique.mappedIncidentIds.length + technique.mappedIndicatorIds.length,
    })).sort((a, b) => b.count - a.count);
    return delay(ranked.slice(0, limit), 350);
  }

  async getSystemHealth(): Promise<SystemHealthMetric[]> {
    return delay(MOCK_SYSTEM_HEALTH, 250);
  }

  async getIndicatorById(id: string): Promise<Indicator | null> {
    await delay(undefined, 250);
    return MOCK_INDICATORS.find((i) => i.id === id) ?? null;
  }

  async getIndicatorsByIds(ids: string[]): Promise<Indicator[]> {
    await delay(undefined, 250);
    const idSet = new Set(ids);
    return MOCK_INDICATORS.filter((i) => idSet.has(i.id));
  }

  async getTechniquesByIds(ids: string[]): Promise<MitreTechnique[]> {
    await delay(undefined, 250);
    const idSet = new Set(ids);
    return MOCK_TECHNIQUES.filter((t) => idSet.has(t.id));
  }
}
