import { AlertModel } from "../database/models/alert.model.js";
import type { AlertDoc } from "../database/models/alert.model.js";
import type { AlertRepository, AlertListParams, AlertSummary } from "./alert.repository.js";
import type { Alert } from "../types/alert.js";
import type { Severity, PaginatedResult } from "../types/common.js";

/** See user.repository.mongo.ts's header comment on verification status — same caveat applies here. */

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];
const UNRESOLVED_STATUSES = ["open", "investigating"];

function toDomain(doc: AlertDoc): Alert {
  return {
    id: doc._id,
    organizationId: doc.organizationId,
    title: doc.title,
    description: doc.description,
    severity: doc.severity,
    confidence: doc.confidence,
    status: doc.status,
    source: doc.source,
    affectedAssets: doc.affectedAssets,
    relatedIndicatorIds: doc.relatedIndicatorIds,
    relatedIncidentId: doc.relatedIncidentId,
    createdAt: doc.createdAt.toISOString(),
  };
}

export class MongoAlertRepository implements AlertRepository {
  async list(organizationId: string, params: AlertListParams): Promise<PaginatedResult<Alert>> {
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
      AlertModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<AlertDoc[]>(),
      AlertModel.countDocuments(filter),
    ]);

    return { items: docs.map(toDomain), total, page, pageSize };
  }

  async getById(organizationId: string, id: string): Promise<Alert | null> {
    const doc = await AlertModel.findOne({ _id: id, organizationId }).lean<AlertDoc>();
    return doc ? toDomain(doc) : null;
  }

  async getSummary(organizationId: string): Promise<AlertSummary> {
    const [bySeverityRows, total, unresolved] = await Promise.all([
      AlertModel.aggregate<{ _id: Severity; count: number }>([
        { $match: { organizationId } },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),
      AlertModel.countDocuments({ organizationId }),
      AlertModel.countDocuments({ organizationId, status: { $in: UNRESOLVED_STATUSES } }),
    ]);
    const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
    for (const row of bySeverityRows) bySeverity[row._id] = row.count;
    return { total, unresolved, bySeverity };
  }

  async update(organizationId: string, id: string, patch: Partial<Alert>): Promise<Alert | null> {
    const { id: _id, organizationId: _orgId, ...safePatch } = patch;
    const doc = await AlertModel.findOneAndUpdate({ _id: id, organizationId }, safePatch, {
      new: true,
    }).lean<AlertDoc>();
    return doc ? toDomain(doc) : null;
  }

  /** Seed helper — mirrors InMemoryAlertRepository.seed's role; not part of the public interface. Upserts so re-running the seed script is idempotent. */
  async seed(alert: Alert): Promise<void> {
    await AlertModel.findByIdAndUpdate(alert.id, { _id: alert.id, ...alert }, { upsert: true, setDefaultsOnInsert: true });
  }
}
