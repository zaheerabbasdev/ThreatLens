import type { InMemoryThreatActorRepository } from "./threatActor.repository.js";
import type { ThreatActor } from "../types/threatActor.js";

/** Mirrors the frontend's src/mocks/threatActors.ts (same IDs/content). */
export function seedThreatActors(repository: InMemoryThreatActorRepository): void {
  const actors: ThreatActor[] = [
    {
      id: "actor_1",
      name: "Cinder Wasp",
      aliases: ["APT-CW", "Silent Ledger"],
      description:
        "Financially motivated group known for credential-harvesting phishing campaigns targeting finance departments, followed by fraudulent wire transfers.",
      motivations: ["financial"],
      techniqueIds: ["T1566", "T1566.002", "T1078"],
      firstObserved: "2023-11-04T00:00:00Z",
    },
    {
      id: "actor_2",
      name: "Glasswing",
      aliases: ["Quiet Harvester"],
      description:
        "Access broker group observed using brute-force and credential-stuffing against exposed authentication gateways, then reselling verified access.",
      motivations: ["financial", "access-broker"],
      techniqueIds: ["T1110", "T1078", "T1021"],
      firstObserved: "2024-06-18T00:00:00Z",
    },
  ];
  repository.seed(actors);
}
