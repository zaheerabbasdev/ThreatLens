import { AuditLogModel } from "../database/models/auditLog.model.js";
import type { AuditLogDoc } from "../database/models/auditLog.model.js";
import type { AuditLogRepository, AuditLogListParams } from "./auditLog.repository.js";
import type { AuditLog } from "../types/audit.js";
import type { PaginatedResult } from "../types/common.js";

/** See user.repository.mongo.ts's header comment on verification status — same caveat applies here. */

function toDomain(doc: AuditLogDoc): AuditLog {
  return {
    id: doc._id,
    organizationId: doc.organizationId,
    actorId: doc.actorId,
    actorName: doc.actorName,
    action: doc.action,
    resourceType: doc.resourceType,
    resourceId: doc.resourceId,
    ipAddress: doc.ipAddress,
    requestId: doc.requestId,
    result: doc.result,
    severity: doc.severity,
    timestamp: doc.timestamp.toISOString(),
  };
}

/** No update/delete method exists here, matching the interface exactly — see auditLog.model.ts for why that's the actual enforcement, not just the schema's `immutable` flags. */
export class MongoAuditLogRepository implements AuditLogRepository {
  async record(entry: Omit<AuditLog, "id">): Promise<AuditLog> {
    const doc = await AuditLogModel.create(entry);
    return toDomain(doc.toObject());
  }

  async list(organizationId: string, params: AuditLogListParams): Promise<PaginatedResult<AuditLog>> {
    const filter: Record<string, unknown> = { organizationId };
    if (params.action) filter["action"] = params.action;
    if (params.result) filter["result"] = params.result;
    if (params.search) {
      const escaped = params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(escaped, "i");
      filter["$or"] = [{ actorName: pattern }, { resourceType: pattern }, { resourceId: pattern }, { action: pattern }];
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const [docs, total] = await Promise.all([
      AuditLogModel.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<AuditLogDoc[]>(),
      AuditLogModel.countDocuments(filter),
    ]);

    return { items: docs.map(toDomain), total, page, pageSize };
  }
}
