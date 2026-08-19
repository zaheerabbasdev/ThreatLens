import type { ThreatActor } from "../types/threatActor.js";

/** Global reference data — same shape/rationale as MitreRepository: no organizationId, seeded once, read-only through the public interface. */
export interface ThreatActorRepository {
  listAll(): Promise<ThreatActor[]>;
}

export class InMemoryThreatActorRepository implements ThreatActorRepository {
  private readonly actors: ThreatActor[] = [];

  async listAll(): Promise<ThreatActor[]> {
    return [...this.actors];
  }

  /** Seed helper — the only way data enters this repository. */
  seed(actors: ThreatActor[]): void {
    this.actors.push(...actors);
  }
}
