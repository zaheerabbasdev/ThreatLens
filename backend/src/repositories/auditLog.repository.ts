import type { AuditAction, AuditLog, AuditResult } from "../types/audit.js";
import type { PaginatedResult } from "../types/common.js";

export interface AuditLogListParams {
  page?: number;
  pageSize?: number;
  action?: AuditAction;
  result?: AuditResult;
  search?: string;
}

/**
 * Append-only by design (spec §39: "restricted deletion", "append-oriented
 * design", "do not allow normal users to delete audit history"). There is
 * deliberately no `update` or `delete` method on this interface — not
 * merely unimplemented, but absent, so nothing built against this contract
 * can even attempt to alter or remove a record, by accident or otherwise.
 */
export interface AuditLogRepository {
  record(entry: Omit<AuditLog, "id">): Promise<AuditLog>;
  list(organizationId: string, params: AuditLogListParams): Promise<PaginatedResult<AuditLog>>;
}

export class InMemoryAuditLogRepository implements AuditLogRepository {
  private readonly logs: AuditLog[] = [];
  private nextId = 1;

  async record(entry: Omit<AuditLog, "id">): Promise<AuditLog> {
    const log: AuditLog = { ...entry, id: `audit_${this.nextId++}` };
    this.logs.push(log);
    return log;
  }

  async list(organizationId: string, params: AuditLogListParams): Promise<PaginatedResult<AuditLog>> {
    let items = this.logs.filter((l) => l.organizationId === organizationId);
    items = [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (params.action) items = items.filter((l) => l.action === params.action);
    if (params.result) items = items.filter((l) => l.result === params.result);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (l) =>
          l.actorName.toLowerCase().includes(q) ||
          l.resourceType.toLowerCase().includes(q) ||
          (l.resourceId?.toLowerCase().includes(q) ?? false) ||
          l.action.toLowerCase().includes(q),
      );
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
  }
}
