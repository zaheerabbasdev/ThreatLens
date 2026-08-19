import type { AuditAction, AuditLog, AuditResult, PageRequest, PaginatedResult } from "@/types";

export type RecordAuditEntryInput = Omit<AuditLog, "id" | "timestamp">;

export interface AuditListParams extends PageRequest {
  action?: AuditAction;
  result?: AuditResult;
}

export interface AuditService {
  list(params?: AuditListParams): Promise<PaginatedResult<AuditLog>>;
  /** Every security-sensitive action should produce an audit record (spec §45). */
  record(entry: RecordAuditEntryInput): Promise<AuditLog>;
}
