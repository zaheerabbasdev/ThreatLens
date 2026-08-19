import type { Severity, WorkflowStatus, PaginatedResult } from "../types/common.js";
import type { Incident, IncidentNote } from "../types/incident.js";

export interface IncidentListParams {
  page?: number;
  pageSize?: number;
  severity?: Severity;
  status?: WorkflowStatus;
  search?: string;
}

export interface IncidentSummary {
  total: number;
  open: number;
  bySeverity: Record<Severity, number>;
}

/**
 * Every method takes `organizationId` as a required first argument — never
 * optional, never inferred from "well the caller is authenticated so it
 * must be fine" (spec §19/§20: object-level authorization + tenant
 * isolation are enforced HERE, at the data-access boundary, not left to
 * callers to remember). `getById` returns null for both "doesn't exist" and
 * "exists but belongs to another organization" — the caller can't tell
 * those apart, which is exactly the point: it's what stops "change the ID
 * in the URL" from working as a cross-tenant read.
 */
export interface IncidentRepository {
  list(organizationId: string, params: IncidentListParams): Promise<PaginatedResult<Incident>>;
  getById(organizationId: string, id: string): Promise<Incident | null>;
  getSummary(organizationId: string): Promise<IncidentSummary>;
  update(organizationId: string, id: string, patch: Partial<Incident>): Promise<Incident | null>;
  addNote(organizationId: string, id: string, note: IncidentNote): Promise<Incident | null>;
}

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low", "info"];
const CLOSED_STATUSES: WorkflowStatus[] = ["resolved", "closed", "false_positive"];

export class InMemoryIncidentRepository implements IncidentRepository {
  private readonly incidentsById = new Map<string, Incident>();

  async list(organizationId: string, params: IncidentListParams): Promise<PaginatedResult<Incident>> {
    let items = [...this.incidentsById.values()].filter((i) => i.organizationId === organizationId);
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (params.severity) items = items.filter((i) => i.severity === params.severity);
    if (params.status) items = items.filter((i) => i.status === params.status);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter((i) => i.title.toLowerCase().includes(q));
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize).map((i) => ({ ...i }));

    return { items: pageItems, total: items.length, page, pageSize };
  }

  async getById(organizationId: string, id: string): Promise<Incident | null> {
    const incident = this.incidentsById.get(id);
    if (!incident || incident.organizationId !== organizationId) return null;
    return { ...incident };
  }

  async getSummary(organizationId: string): Promise<IncidentSummary> {
    const items = [...this.incidentsById.values()].filter((i) => i.organizationId === organizationId);
    const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, 0])) as Record<Severity, number>;
    for (const incident of items) bySeverity[incident.severity] += 1;
    const open = items.filter((i) => !CLOSED_STATUSES.includes(i.status)).length;
    return { total: items.length, open, bySeverity };
  }

  async update(organizationId: string, id: string, patch: Partial<Incident>): Promise<Incident | null> {
    const existing = this.incidentsById.get(id);
    if (!existing || existing.organizationId !== organizationId) return null;
    const updated: Incident = { ...existing, ...patch, id: existing.id, organizationId: existing.organizationId };
    this.incidentsById.set(id, updated);
    return { ...updated };
  }

  async addNote(organizationId: string, id: string, note: IncidentNote): Promise<Incident | null> {
    const existing = this.incidentsById.get(id);
    if (!existing || existing.organizationId !== organizationId) return null;
    const updated: Incident = {
      ...existing,
      notes: [note, ...existing.notes],
      updatedAt: new Date().toISOString(),
    };
    this.incidentsById.set(id, updated);
    return { ...updated };
  }

  /** Test/seed helper only — never exposed through the interface real callers depend on. */
  seed(incident: Incident): void {
    this.incidentsById.set(incident.id, incident);
  }
}
