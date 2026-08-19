export interface MitreTactic {
  id: string;
  name: string;
  shortName: string;
  description: string;
}

/**
 * The static, global part of a technique — shared reference data, not
 * scoped to any organization (spec §44: MITRE ATT&CK is a public taxonomy).
 */
export interface MitreTechniqueBase {
  id: string;
  tacticIds: string[];
  name: string;
  description: string;
  isSubTechnique: boolean;
  parentTechniqueId?: string;
}

/**
 * What a client actually gets back: the static technique plus
 * organization-scoped mappings, computed per-request rather than stored —
 * see mitre.service.ts for why storing them statically (as the frontend
 * mock does) would leak one organization's incident/indicator IDs to every
 * other organization asking about the same shared technique.
 */
export interface MitreTechnique extends MitreTechniqueBase {
  mappedIncidentIds: string[];
  mappedIndicatorIds: string[];
}
