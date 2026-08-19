import type { AuditLogRepository, AuditLogListParams } from "../repositories/auditLog.repository.js";
import type { AuditAction, AuditLog, AuditResult, AuditSeverity } from "../types/audit.js";
import type { PaginatedResult } from "../types/common.js";
import { getRequestContext } from "../middleware/requestContext.js";
import { logger } from "../utils/logger.js";

export interface RecordAuditEntryInput {
  organizationId: string;
  actorId: string;
  actorName: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  result: AuditResult;
  severity: AuditSeverity;
}

/**
 * `requestId`/`ipAddress` are pulled from the current request's
 * AsyncLocalStorage context (set by requestContextMiddleware) rather than
 * being parameters every caller has to remember to pass — everything else
 * (actor, org, action, resource, result) is explicit, matching how every
 * other service in this codebase already threads organizationId/actorId
 * through its own methods.
 */
export class AuditService {
  constructor(private readonly logs: AuditLogRepository) {}

  async record(input: RecordAuditEntryInput): Promise<AuditLog> {
    const context = getRequestContext();
    if (!context) {
      // Should only happen from code running outside an HTTP request (a
      // background job, once those exist) — log loudly rather than write a
      // record with a fabricated request ID, since spec §38 treats that
      // field as meaningful for tracing.
      logger.warn({ input }, "Audit record requested with no request context available");
    }
    return this.logs.record({
      ...input,
      requestId: context?.requestId ?? "unknown",
      ipAddress: context?.ip ?? "unknown",
      timestamp: new Date().toISOString(),
    });
  }

  list(organizationId: string, params: AuditLogListParams): Promise<PaginatedResult<AuditLog>> {
    return this.logs.list(organizationId, params);
  }
}
