import type { Alert, PageRequest, PaginatedResult, Severity, WorkflowStatus } from "@/types";

export interface AlertListParams extends PageRequest {
  severity?: Severity;
  status?: WorkflowStatus;
}

export interface AlertSummary {
  total: number;
  unresolved: number;
  bySeverity: Record<Severity, number>;
}

export interface AlertService {
  list(params?: AlertListParams): Promise<PaginatedResult<Alert>>;
  getById(id: string): Promise<Alert | null>;
  getSummary(): Promise<AlertSummary>;
  updateStatus(id: string, status: WorkflowStatus): Promise<Alert>;
}
