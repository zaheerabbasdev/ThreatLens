import { ThreatActorModel } from "../database/models/threatActor.model.js";
import type { ThreatActorDoc } from "../database/models/threatActor.model.js";
import type { ThreatActorRepository } from "./threatActor.repository.js";
import type { ThreatActor } from "../types/threatActor.js";

/** See user.repository.mongo.ts's header comment on verification status — same caveat applies here. */

function toDomain(doc: ThreatActorDoc): ThreatActor {
  return {
    id: doc._id,
    name: doc.name,
    aliases: doc.aliases,
    description: doc.description,
    motivations: doc.motivations,
    techniqueIds: doc.techniqueIds,
    firstObserved: doc.firstObserved?.toISOString(),
  };
}

export class MongoThreatActorRepository implements ThreatActorRepository {
  async listAll(): Promise<ThreatActor[]> {
    const docs = await ThreatActorModel.find().lean<ThreatActorDoc[]>();
    return docs.map(toDomain);
  }

  /** Seed helper — mirrors InMemoryThreatActorRepository.seed's role; not part of the public interface. Upserts so re-running the seed script is idempotent. */
  async seed(actors: ThreatActor[]): Promise<void> {
    await Promise.all(
      actors.map((a) => ThreatActorModel.findByIdAndUpdate(a.id, { _id: a.id, ...a }, { upsert: true, setDefaultsOnInsert: true })),
    );
  }
}
