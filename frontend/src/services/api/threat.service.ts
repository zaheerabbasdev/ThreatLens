import type { ThreatService, TopTechnique } from "@/services/threat.service";
import type { Indicator, MitreTechnique, RiskScore } from "@/types";
import type { SystemHealthMetric, ThreatActivityPoint } from "@/mocks/threatActivity";
import { ApiIOCService } from "./ioc.service";
import { ApiMitreService } from "./mitre.service";

/** Uses real IOC and MITRE endpoints; unsupported dashboard aggregations stay empty. */
export class ApiThreatService implements ThreatService {
  private readonly ioc = new ApiIOCService();
  private readonly mitre = new ApiMitreService();

  async getOrgRiskScore(): Promise<RiskScore | null> {
    return null;
  }

  async getRiskScoreById(_id: string): Promise<RiskScore | null> {
    return null;
  }

  async listTopIndicators(limit = 5): Promise<Indicator[]> {
    const result = await this.ioc.list({ page: 1, pageSize: 100 });
    return [...result.items].sort((a, b) => b.riskScore - a.riskScore).slice(0, limit);
  }

  async listActivityTimeline(): Promise<ThreatActivityPoint[]> {
    return [];
  }

  async listTopTechniques(limit = 5): Promise<TopTechnique[]> {
    const techniques = await this.mitre.listTechniques();
    return techniques
      .map((technique) => ({
        technique,
        count: technique.mappedIncidentIds.length + technique.mappedIndicatorIds.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async getSystemHealth(): Promise<SystemHealthMetric[]> {
    return [];
  }

  getIndicatorById(id: string): Promise<Indicator | null> {
    return this.ioc.getById(id);
  }

  async getIndicatorsByIds(ids: string[]): Promise<Indicator[]> {
    const indicators = await Promise.all(ids.map((id) => this.ioc.getById(id)));
    return indicators.filter((indicator): indicator is Indicator => indicator !== null);
  }

  async getTechniquesByIds(ids: string[]): Promise<MitreTechnique[]> {
    const techniques = await Promise.all(ids.map((id) => this.mitre.getTechniqueById(id)));
    return techniques.filter((technique): technique is MitreTechnique => technique !== null);
  }
}
