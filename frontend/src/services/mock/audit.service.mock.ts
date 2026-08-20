import type { AuditListParams, AuditService, RecordAuditEntryInput } from "@/services/audit.service";
import type { AuditLog, PaginatedResult } from "@/types";
import { MOCK_AUDIT_LOGS } from "@/mocks/auditLogs";
import { generateId } from "@/utils/id";
import { delay, paginate } from "./util";

export class MockAuditService implements AuditService {
  async list(params?: AuditListParams): Promise<PaginatedResult<AuditLog>> {
    let items = [...MOCK_AUDIT_LOGS].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    if (params?.action) items = items.filter((l) => l.action === params.action);
    if (params?.result) items = items.filter((l) => l.result === params.result);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (l) =>
          l.actorName.toLowerCase().includes(q) ||
          l.resourceType.toLowerCase().includes(q) ||
          (l.resourceId?.toLowerCase().includes(q) ?? false) ||
          l.action.toLowerCase().includes(q),
      );
    }
    return delay(paginate(items, params), 300);
  }

  async record(entry: RecordAuditEntryInput): Promise<AuditLog> {
    const log: AuditLog = { ...entry, id: generateId("audit"), timestamp: new Date().toISOString() };
    MOCK_AUDIT_LOGS.unshift(log);
    return delay(log, 100);
  }
}
