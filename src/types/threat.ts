import type { ISODateString } from "./common";

export interface MitreTactic {
  id: string;
  name: string;
  shortName: string;
  description: string;
}

export interface MitreTechnique {
  id: string;
  tacticIds: string[];
  name: string;
  description: string;
  isSubTechnique: boolean;
  parentTechniqueId?: string;
  mappedIncidentIds: string[];
  mappedIndicatorIds: string[];
}

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  motivations: string[];
  techniqueIds: string[];
  firstObserved?: ISODateString;
}
