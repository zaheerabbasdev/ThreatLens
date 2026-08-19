import { ReportModel } from "../database/models/report.model.js";
import type { ReportDoc } from "../database/models/report.model.js";
import type { ReportRepository, ReportListParams } from "./report.repository.js";
import type { Report } from "../types/report.js";
import type { PaginatedResult } from "../types/common.js";

/** See user.repository.mongo.ts's header comment on verification status — same caveat applies here. */

function toDomain(doc: ReportDoc): Report {
  return {
    id: doc._id,
    organizationId: doc.organizationId,
    type: doc.type,
    title: doc.title,
    summary: doc.summary,
    generatedAt: doc.generatedAt.toISOString(),
    generatedBy: doc.generatedBy,
    periodStart: doc.periodStart.toISOString(),
    periodEnd: doc.periodEnd.toISOString(),
  };
}

export class MongoReportRepository implements ReportRepository {
  async list(organizationId: string, params: ReportListParams): Promise<PaginatedResult<Report>> {
    const filter: Record<string, unknown> = { organizationId };
    if (params.type) filter["type"] = params.type;
    if (params.search) {
      const escaped = params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter["title"] = new RegExp(escaped, "i");
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const [docs, total] = await Promise.all([
      ReportModel.find(filter)
        .sort({ generatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<ReportDoc[]>(),
      ReportModel.countDocuments(filter),
    ]);

    return { items: docs.map(toDomain), total, page, pageSize };
  }

  async getById(organizationId: string, id: string): Promise<Report | null> {
    const doc = await ReportModel.findOne({ _id: id, organizationId }).lean<ReportDoc>();
    return doc ? toDomain(doc) : null;
  }

  async create(report: Report): Promise<Report> {
    const doc = await ReportModel.create({ ...report, _id: report.id });
    return toDomain(doc.toObject());
  }

  /** Seed helper — mirrors InMemoryReportRepository.seed's role; not part of the public interface. Upserts so re-running the seed script is idempotent. */
  async seed(report: Report): Promise<void> {
    await ReportModel.findByIdAndUpdate(report.id, { _id: report.id, ...report }, { upsert: true, setDefaultsOnInsert: true });
  }
}
