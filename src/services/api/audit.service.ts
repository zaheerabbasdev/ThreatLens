import type { AuditListParams, AuditService, RecordAuditEntryInput } from "@/services/audit.service";
import type { AuditLog, PaginatedResult } from "@/types";
import { requestWithMeta } from "./client";

export class ApiAuditService implements AuditService {
  async list(params?: AuditListParams): Promise<PaginatedResult<AuditLog>> {
    const { data, meta } = await requestWithMeta<AuditLog[]>("/audit-logs", {
      query: { page: params?.page, pageSize: params?.pageSize, action: params?.action, result: params?.result, search: params?.search },
    });
    return {
      items: data,
      total: (meta?.["total"] as number | undefined) ?? data.length,
      page: (meta?.["page"] as number | undefined) ?? params?.page ?? 1,
      pageSize: (meta?.["pageSize"] as number | undefined) ?? params?.pageSize ?? data.length,
    };
  }

  /**
   * Deliberate no-op against the real backend. Every mock caller invokes
   * this purely because MockAuditService is the ONLY thing that ever
   * records anything in mock mode; against the real API, the action that
   * just succeeded (e.g. `incidents.updateStatus`) already recorded its
   * own real, server-attributed audit entry as a direct side effect —
   * see backend/README.md's Audit Logs section. The backend's audit
   * router has no write route at all (spec §39: read-only, no client-
   * submitted entries, ever) — calling one here would either 404 or, if
   * one existed, undermine the exact guarantee that route's absence
   * protects. Returns a locally-synthesized object only to satisfy the
   * shared interface's return type; nothing here is sent or persisted,
   * and no caller in this codebase reads the return value.
   */
  async record(entry: RecordAuditEntryInput): Promise<AuditLog> {
    return { ...entry, id: "client-side-noop", timestamp: new Date().toISOString() };
  }
}
