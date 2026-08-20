import { IndicatorModel } from "../database/models/indicator.model.js";
import type { IndicatorDoc } from "../database/models/indicator.model.js";
import type { IndicatorRepository, IndicatorListParams } from "./indicator.repository.js";
import type { Indicator } from "../types/indicator.js";
import type { PaginatedResult } from "../types/common.js";

/** See user.repository.mongo.ts's header comment on verification status — same caveat applies here. */

function toDomain(doc: IndicatorDoc): Indicator {
  const base = {
    id: doc._id,
    organizationId: doc.organizationId,
    value: doc.value,
    riskScore: doc.riskScore,
    severity: doc.severity,
    confidence: doc.confidence,
    firstSeen: doc.firstSeen.toISOString(),
    lastSeen: doc.lastSeen.toISOString(),
    tags: doc.tags,
    relatedIncidentIds: doc.relatedIncidentIds,
    sources: doc.sources.map((s) => ({ ...s, fetchedAt: s.fetchedAt.toISOString() })),
    submittedBy: doc.submittedBy,
    notes: doc.notes,
  };

  switch (doc.type) {
    case "ip":
      return {
        ...base,
        type: "ip",
        country: doc.country,
        countryCode: doc.countryCode,
        asn: doc.asn,
        asnOrg: doc.asnOrg,
        isTor: doc.isTor,
        relatedDomainIds: doc.relatedDomainIds ?? [],
      };
    case "domain":
      return {
        ...base,
        type: "domain",
        registrar: doc.registrar,
        registeredAt: doc.registeredAt?.toISOString(),
        relatedIpIds: doc.relatedIpIds ?? [],
        relatedUrlIds: doc.relatedUrlIds ?? [],
      };
    case "url":
      return {
        ...base,
        type: "url",
        domain: doc.domain!,
        path: doc.path!,
        isMalwareHost: doc.isMalwareHost ?? false,
        relatedIndicatorIds: doc.relatedIndicatorIds ?? [],
      };
    case "hash":
      return {
        ...base,
        type: "hash",
        algorithm: doc.algorithm!,
        fileName: doc.fileName,
        fileType: doc.fileType,
        fileSizeBytes: doc.fileSizeBytes,
        malwareFamily: doc.malwareFamily,
      };
  }
}

export class MongoIndicatorRepository implements IndicatorRepository {
  async list(organizationId: string, params: IndicatorListParams): Promise<PaginatedResult<Indicator>> {
    const filter: Record<string, unknown> = { organizationId };
    if (params.type) filter["type"] = params.type;
    if (params.severity) filter["severity"] = params.severity;
    if (params.search) {
      const escaped = params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter["value"] = new RegExp(escaped, "i");
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const [docs, total] = await Promise.all([
      IndicatorModel.find(filter)
        .sort({ lastSeen: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<IndicatorDoc[]>(),
      IndicatorModel.countDocuments(filter),
    ]);

    return { items: docs.map(toDomain), total, page, pageSize };
  }

  async getById(organizationId: string, id: string): Promise<Indicator | null> {
    const doc = await IndicatorModel.findOne({ _id: id, organizationId }).lean<IndicatorDoc>();
    return doc ? toDomain(doc) : null;
  }

  async create(indicator: Indicator): Promise<Indicator> {
    const doc = await IndicatorModel.create({ ...indicator, _id: indicator.id });
    return toDomain(doc.toObject());
  }

  async update(organizationId: string, id: string, patch: Partial<Indicator>): Promise<Indicator | null> {
    const doc = await IndicatorModel.findOneAndUpdate({ _id: id, organizationId }, patch, { new: true }).lean<IndicatorDoc>();
    return doc ? toDomain(doc) : null;
  }

  /** Seed helper — mirrors InMemoryIndicatorRepository.seed's role; not part of the public interface. Upserts so re-running the seed script is idempotent. */
  async seed(indicator: Indicator): Promise<void> {
    await IndicatorModel.findByIdAndUpdate(
      indicator.id,
      { _id: indicator.id, ...indicator },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }
}
