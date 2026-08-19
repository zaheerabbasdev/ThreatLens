import { MitreTacticModel, MitreTechniqueModel } from "../database/models/mitre.model.js";
import type { MitreTacticDoc, MitreTechniqueDoc } from "../database/models/mitre.model.js";
import type { MitreRepository, MitreTechniqueListParams } from "./mitre.repository.js";
import type { MitreTactic, MitreTechniqueBase } from "../types/mitre.js";

/** See user.repository.mongo.ts's header comment on verification status — same caveat applies here. */

function tacticToDomain(doc: MitreTacticDoc): MitreTactic {
  return { id: doc._id, name: doc.name, shortName: doc.shortName, description: doc.description };
}
function techniqueToDomain(doc: MitreTechniqueDoc): MitreTechniqueBase {
  return {
    id: doc._id,
    tacticIds: doc.tacticIds,
    name: doc.name,
    description: doc.description,
    isSubTechnique: doc.isSubTechnique,
    parentTechniqueId: doc.parentTechniqueId,
  };
}

export class MongoMitreRepository implements MitreRepository {
  async listTactics(): Promise<MitreTactic[]> {
    const docs = await MitreTacticModel.find().lean<MitreTacticDoc[]>();
    return docs.map(tacticToDomain);
  }

  async listTechniques(params: MitreTechniqueListParams): Promise<MitreTechniqueBase[]> {
    const filter: Record<string, unknown> = {};
    if (params.tacticId) filter["tacticIds"] = params.tacticId;
    if (params.search) {
      const escaped = params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(escaped, "i");
      filter["$or"] = [{ _id: pattern }, { name: pattern }];
    }
    const docs = await MitreTechniqueModel.find(filter).lean<MitreTechniqueDoc[]>();
    return docs.map(techniqueToDomain);
  }

  async getTechniqueById(id: string): Promise<MitreTechniqueBase | null> {
    const doc = await MitreTechniqueModel.findById(id).lean<MitreTechniqueDoc>();
    return doc ? techniqueToDomain(doc) : null;
  }

  /** Seed helper — mirrors InMemoryMitreRepository.seed's role; not part of the public MitreRepository interface. Upserts so re-running the seed script is idempotent. */
  async seed(tactics: MitreTactic[], techniques: MitreTechniqueBase[]): Promise<void> {
    await Promise.all([
      ...tactics.map((t) =>
        MitreTacticModel.findByIdAndUpdate(t.id, { _id: t.id, ...t }, { upsert: true, setDefaultsOnInsert: true }),
      ),
      ...techniques.map((t) =>
        MitreTechniqueModel.findByIdAndUpdate(t.id, { _id: t.id, ...t }, { upsert: true, setDefaultsOnInsert: true }),
      ),
    ]);
  }
}
