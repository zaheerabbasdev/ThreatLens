import type { Severity, WorkflowStatus, PaginatedResult } from "../types/common.js";
import type { Alert } from "../types/alert.js";

export interface AlertListParams {
  page?: number;
  pageSize?: number;
  severity?: Severity;
  status?: WorkflowStatus;
  search?: string;
}

export interface AlertSummary {
  total: number;
  unresolved: number;
  bySeverity: Record<Severity, number>;
}

/** Same tenant-isolation contract as IncidentRepository — see its comment. */
export interface AlertRepository {
  list(organizationId: string, params: AlertListParams): Promise<PaginatedResult<Alert>>;
  getById(organizationId: string, id: string): Promise<Alert | null>;
  getSummary(organizationId: string): Promise<AlertSummary>;
  update(organizationId: string, id: string, patch: Partial<Alert>): Promise<Alert | null>;
}

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];
const UNRESOLVED_STATUSES: WorkflowStatus[] = ["open", "investigating"];

export class InMemoryAlertRepository implements AlertRepository {
  private readonly alertsById = new Map<string, Alert>();

  async list(organizationId: string, params: AlertListParams): Promise<PaginatedResult<Alert>> {
    let items = [...this.alertsById.values()].filter((a) => a.organizationId === organizationId);
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (params.severity) items = items.filter((a) => a.severity === params.severity);
    if (params.status) items = items.filter((a) => a.status === params.status);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter((a) => a.title.toLowerCase().includes(q));
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize).map((a) => ({ ...a }));

    return { items: pageItems, total: items.length, page, pageSize };
  }

  async getById(organizationId: string, id: string): Promise<Alert | null> {
    const alert = this.alertsById.get(id);
    if (!alert || alert.organizationId !== organizationId) return null;
    return { ...alert };
  }

  async getSummary(organizationId: string): Promise<AlertSummary> {
    const items = [...this.alertsById.values()].filter((a) => a.organizationId === organizationId);
    const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
    for (const alert of items) bySeverity[alert.severity] += 1;
    const unresolved = items.filter((a) => UNRESOLVED_STATUSES.includes(a.status)).length;
    return { total: items.length, unresolved, bySeverity };
  }

  async update(organizationId: string, id: string, patch: Partial<Alert>): Promise<Alert | null> {
    const existing = this.alertsById.get(id);
    if (!existing || existing.organizationId !== organizationId) return null;
    const updated: Alert = { ...existing, ...patch, id: existing.id, organizationId: existing.organizationId };
    this.alertsById.set(id, updated);
    return { ...updated };
  }

  /** Test/seed helper only — never exposed through the interface real callers depend on. */
  seed(alert: Alert): void {
    this.alertsById.set(alert.id, alert);
  }
}
