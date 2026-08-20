import type { MitreTactic, MitreTechnique } from "@/types";

export interface MitreTechniqueListParams {
  tacticId?: string;
  search?: string;
}

/**
 * Read-only access to the ATT&CK reference data (tactics + techniques).
 * Backed today by static mock data mirroring a small slice of the real
 * framework; a future implementation would sync this from MITRE's own
 * STIX feed (spec §44) without changing this interface.
 */
export interface MitreService {
  listTactics(): Promise<MitreTactic[]>;
  listTechniques(params?: MitreTechniqueListParams): Promise<MitreTechnique[]>;
  getTechniqueById(id: string): Promise<MitreTechnique | null>;
}
