/** Global reference data, same as MitreTactic/MitreTechniqueBase — no organizationId (spec §41: shared threat intelligence, not tenant data). */
export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  motivations: string[];
  techniqueIds: string[];
  firstObserved?: string;
}
