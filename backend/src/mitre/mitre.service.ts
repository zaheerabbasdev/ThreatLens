import { NotFoundError } from "../errors/AppError.js";
import type { MitreRepository, MitreTechniqueListParams } from "../repositories/mitre.repository.js";
import type { IncidentRepository } from "../repositories/incident.repository.js";
import type { MitreTactic, MitreTechnique, MitreTechniqueBase } from "../types/mitre.js";

/** All incidents in the org, unpaginated — see the comment on mapTechnique below for why. */
const ALL_INCIDENTS_PAGE_SIZE = 10_000;

export class MitreService {
  constructor(
    private readonly mitre: MitreRepository,
    private readonly incidents: IncidentRepository,
  ) {}

  listTactics(): Promise<MitreTactic[]> {
    return this.mitre.listTactics();
  }

  async listTechniques(organizationId: string, params: MitreTechniqueListParams): Promise<MitreTechnique[]> {
    const [techniques, incidentMap] = await Promise.all([
      this.mitre.listTechniques(params),
      this.orgIncidents(organizationId),
    ]);
    return techniques.map((t) => this.mapTechnique(t, incidentMap));
  }

  async getTechniqueById(organizationId: string, id: string): Promise<MitreTechnique> {
    const [technique, incidentMap] = await Promise.all([
      this.mitre.getTechniqueById(id),
      this.orgIncidents(organizationId),
    ]);
    if (!technique) throw new NotFoundError("The requested technique was not found.");
    return this.mapTechnique(technique, incidentMap);
  }

  private async orgIncidents(organizationId: string) {
    const { items } = await this.incidents.list(organizationId, { pageSize: ALL_INCIDENTS_PAGE_SIZE });
    return items;
  }

  /**
   * `mappedIncidentIds`/`mappedIndicatorIds` are computed here, per request,
   * scoped to the caller's organization — never stored as a static field on
   * the technique (unlike the frontend mock's mock data). MITRE techniques
   * are shared global reference data with no organization boundary of
   * their own; if the mapping were baked into the technique record, org A's
   * incident IDs would show up when org B asks about the same shared
   * technique, which is exactly the kind of cross-tenant leak spec §20
   * exists to prevent.
   *
   * `mappedIndicatorIds` has no direct backing field on Indicator (indicators
   * don't carry a technique association) — it's derived honestly from the
   * mapped incidents' own `indicatorIds`, rather than inventing a
   * relationship that doesn't otherwise exist in the domain model.
   */
  private mapTechnique(
    technique: MitreTechniqueBase,
    orgIncidents: Awaited<ReturnType<IncidentRepository["list"]>>["items"],
  ): MitreTechnique {
    const mapped = orgIncidents.filter((i) => i.mitreTechniqueIds.includes(technique.id));
    const indicatorIds = new Set<string>();
    for (const incident of mapped) {
      for (const indicatorId of incident.indicatorIds) indicatorIds.add(indicatorId);
    }
    return {
      ...technique,
      mappedIncidentIds: mapped.map((i) => i.id),
      mappedIndicatorIds: [...indicatorIds],
    };
  }
}
