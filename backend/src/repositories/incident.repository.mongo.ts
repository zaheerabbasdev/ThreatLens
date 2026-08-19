import { IncidentModel } from "../database/models/incident.model.js";
import type { IncidentDoc } from "../database/models/incident.model.js";
import type { IncidentRepository, IncidentListParams, IncidentSummary } from "./incident.repository.js";
import type { Incident, IncidentNote } from "../types/incident.js";
import type { Severity, PaginatedResult } from "../types/common.js";

/** See user.repository.mongo.ts's header comment on verification status — same caveat applies here. */

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];
const CLOSED_STATUSES = ["resolved", "closed", "false_positive"];

function toDomain(doc: IncidentDoc): Incident {
  return {
    id: doc._id,
    organizationId: doc.organizationId,
    title: doc.title,
    description: doc.description,
    severity: doc.severity,
    confidence: doc.confidence,
    status: doc.status,
    assignedAnalystId: doc.assignedAnalystId,
    affectedAssets: doc.affectedAssets,
    indicatorIds: doc.indicatorIds,
    mitreTechniqueIds: doc.mitreTechniqueIds,
    timeline: doc.timeline.map((t) => ({ ...t, timestamp: t.timestamp.toISOString() })),
    evidence: doc.evidence.map((e) => ({ ...e, collectedAt: e.collectedAt.toISOString() })),
    behavioralFindings: doc.behavioralFindings,
    notes: doc.notes.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
    riskScoreId: doc.riskScoreId,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export class MongoIncidentRepository implements IncidentRepository {
  async list(organizationId: string, params: IncidentListParams): Promise<PaginatedResult<Incident>> {
    const filter: Record<string, unknown> = { organizationId };
    if (params.severity) filter["severity"] = params.severity;
    if (params.status) filter["status"] = params.status;
    if (params.search) {
      const escaped = params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter["title"] = new RegExp(escaped, "i");
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const [docs, total] = await Promise.all([
      IncidentModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<IncidentDoc[]>(),
      IncidentModel.countDocuments(filter),
    ]);

    return { items: docs.map(toDomain), total, page, pageSize };
  }

  async getById(organizationId: string, id: string): Promise<Incident | null> {
    const doc = await IncidentModel.findOne({ _id: id, organizationId }).lean<IncidentDoc>();
    return doc ? toDomain(doc) : null;
  }

  async getSummary(organizationId: string): Promise<IncidentSummary> {
    const [bySeverityRows, total, open] = await Promise.all([
      IncidentModel.aggregate<{ _id: Severity; count: number }>([
        { $match: { organizationId } },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),
      IncidentModel.countDocuments({ organizationId }),
      IncidentModel.countDocuments({ organizationId, status: { $nin: CLOSED_STATUSES } }),
    ]);
    const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
    for (const row of bySeverityRows) bySeverity[row._id] = row.count;
    return { total, open, bySeverity };
  }

  async update(organizationId: string, id: string, patch: Partial<Incident>): Promise<Incident | null> {
    const { id: _id, organizationId: _orgId, ...safePatch } = patch;
    const doc = await IncidentModel.findOneAndUpdate({ _id: id, organizationId }, safePatch, {
      new: true,
    }).lean<IncidentDoc>();
    return doc ? toDomain(doc) : null;
  }

  async addNote(organizationId: string, id: string, note: IncidentNote): Promise<Incident | null> {
    const doc = await IncidentModel.findOneAndUpdate(
      { _id: id, organizationId },
      { $push: { notes: { $each: [note], $position: 0 } }, $set: { updatedAt: new Date() } },
      { new: true },
    ).lean<IncidentDoc>();
    return doc ? toDomain(doc) : null;
  }

  /** Seed helper — mirrors InMemoryIncidentRepository.seed's role; not part of the public interface. Upserts so re-running the seed script is idempotent. */
  async seed(incident: Incident): Promise<void> {
    await IncidentModel.findByIdAndUpdate(
      incident.id,
      { _id: incident.id, ...incident },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }
}
