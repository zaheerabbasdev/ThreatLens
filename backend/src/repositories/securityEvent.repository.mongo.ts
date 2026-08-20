import { SecurityEventModel } from "../database/models/securityEvent.model.js";
import type { SecurityEventDoc } from "../database/models/securityEvent.model.js";
import type { SecurityEventRepository } from "./securityEvent.repository.js";
import type { SecurityEvent } from "../types/securityEvent.js";

/** See user.repository.mongo.ts's header comment on verification status — same caveat applies here (never run against a real MongoDB in this environment). */

function toDomain(doc: SecurityEventDoc): SecurityEvent {
  return {
    id: doc._id,
    organizationId: doc.organizationId,
    userId: doc.userId,
    type: doc.type,
    description: doc.description,
    severity: doc.severity,
    sourceIp: doc.sourceIp,
    isNewLocation: doc.isNewLocation,
    authFailed: doc.authFailed,
    isDownload: doc.isDownload,
    endpoint: doc.endpoint,
    timestamp: doc.timestamp.toISOString(),
  };
}

export class MongoSecurityEventRepository implements SecurityEventRepository {
  async create(event: SecurityEvent): Promise<SecurityEvent> {
    const doc = await SecurityEventModel.create({ ...event, _id: event.id });
    return toDomain(doc.toObject());
  }

  async list(organizationId: string, page: number, pageSize: number): Promise<{ items: SecurityEvent[]; total: number }> {
    const filter = { organizationId };
    const [docs, total] = await Promise.all([
      SecurityEventModel.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<SecurityEventDoc[]>(),
      SecurityEventModel.countDocuments(filter),
    ]);
    return { items: docs.map(toDomain), total };
  }

  async listForUser(organizationId: string, userId: string): Promise<SecurityEvent[]> {
    const docs = await SecurityEventModel.find({ organizationId, userId }).sort({ timestamp: 1 }).lean<SecurityEventDoc[]>();
    return docs.map(toDomain);
  }

  /** Seed helper — mirrors the other repositories' .seed() role; not part of the public interface. Upserts so re-running the seed script is idempotent. */
  async seed(event: SecurityEvent): Promise<void> {
    await SecurityEventModel.findByIdAndUpdate(event.id, { _id: event.id, ...event }, { upsert: true, setDefaultsOnInsert: true });
  }
}
