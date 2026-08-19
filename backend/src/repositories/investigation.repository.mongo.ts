import { InvestigationModel } from "../database/models/investigation.model.js";
import type { InvestigationDoc } from "../database/models/investigation.model.js";
import type { InvestigationRepository, InvestigationListParams } from "./investigation.repository.js";
import type { Investigation, InvestigationNote } from "../types/investigation.js";
import type { PaginatedResult } from "../types/common.js";

/** See user.repository.mongo.ts's header comment on verification status — same caveat applies here. */

function toDomain(doc: InvestigationDoc): Investigation {
  return {
    id: doc._id,
    organizationId: doc.organizationId,
    title: doc.title,
    description: doc.description,
    leadAnalystId: doc.leadAnalystId,
    status: doc.status,
    relatedIncidentIds: doc.relatedIncidentIds,
    relatedIndicatorIds: doc.relatedIndicatorIds,
    notes: doc.notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
    timeline: doc.timeline.map((t) => ({ ...t, timestamp: t.timestamp.toISOString() })),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export class MongoInvestigationRepository implements InvestigationRepository {
  async list(organizationId: string, params: InvestigationListParams): Promise<PaginatedResult<Investigation>> {
    const filter: Record<string, unknown> = { organizationId };
    if (params.status) filter["status"] = params.status;
    if (params.search) {
      const escaped = params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter["title"] = new RegExp(escaped, "i");
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const [docs, total] = await Promise.all([
      InvestigationModel.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<InvestigationDoc[]>(),
      InvestigationModel.countDocuments(filter),
    ]);

    return { items: docs.map(toDomain), total, page, pageSize };
  }

  async getById(organizationId: string, id: string): Promise<Investigation | null> {
    const doc = await InvestigationModel.findOne({ _id: id, organizationId }).lean<InvestigationDoc>();
    return doc ? toDomain(doc) : null;
  }

  async create(investigation: Investigation): Promise<Investigation> {
    const doc = await InvestigationModel.create({ ...investigation, _id: investigation.id });
    return toDomain(doc.toObject());
  }

  async update(organizationId: string, id: string, patch: Partial<Investigation>): Promise<Investigation | null> {
    const { id: _id, organizationId: _orgId, ...safePatch } = patch;
    const doc = await InvestigationModel.findOneAndUpdate({ _id: id, organizationId }, safePatch, {
      new: true,
    }).lean<InvestigationDoc>();
    return doc ? toDomain(doc) : null;
  }

  async addNote(organizationId: string, id: string, note: InvestigationNote): Promise<Investigation | null> {
    const doc = await InvestigationModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $push: { notes: { $each: [note], $position: 0 } }, $set: { updatedAt: new Date() } },
      { new: true },
    ).lean<InvestigationDoc>();
    return doc ? toDomain(doc) : null;
  }

  /** Seed helper — mirrors InMemoryInvestigationRepository.seed's role; not part of the public interface. Upserts so re-running the seed script is idempotent. */
  async seed(investigation: Investigation): Promise<void> {
    await InvestigationModel.findByIdAndUpdate(
      investigation.id,
      { _id: investigation.id, ...investigation },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }
}
