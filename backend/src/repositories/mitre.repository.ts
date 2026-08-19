import type { MitreTactic, MitreTechniqueBase } from "../types/mitre.js";

export interface MitreTechniqueListParams {
  tacticId?: string;
  search?: string;
}

/**
 * Read-only reference data — no organizationId anywhere (this is a shared
 * public taxonomy, not tenant data), and no create/update either: it's
 * seeded once at startup. A real implementation would sync this from
 * MITRE's own STIX feed (spec §44) without this interface changing.
 */
export interface MitreRepository {
  listTactics(): Promise<MitreTactic[]>;
  listTechniques(params: MitreTechniqueListParams): Promise<MitreTechniqueBase[]>;
  getTechniqueById(id: string): Promise<MitreTechniqueBase | null>;
}

export class InMemoryMitreRepository implements MitreRepository {
  private readonly tactics: MitreTactic[] = [];
  private readonly techniquesById = new Map<string, MitreTechniqueBase>();

  async listTactics(): Promise<MitreTactic[]> {
    return [...this.tactics];
  }

  async listTechniques(params: MitreTechniqueListParams): Promise<MitreTechniqueBase[]> {
    let items = [...this.techniquesById.values()];
    if (params.tacticId) items = items.filter((t) => t.tacticIds.includes(params.tacticId!));
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter((t) => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
    }
    return items;
  }

  async getTechniqueById(id: string): Promise<MitreTechniqueBase | null> {
    return this.techniquesById.get(id) ?? null;
  }

  /** Seed helper — this is the only way data enters this repository; there's no create/update in the public interface. */
  seed(tactics: MitreTactic[], techniques: MitreTechniqueBase[]): void {
    this.tactics.push(...tactics);
    for (const t of techniques) this.techniquesById.set(t.id, t);
  }
}
