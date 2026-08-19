import type { WorkflowStatus, PaginatedResult } from "../types/common.js";
import type { Investigation, InvestigationNote } from "../types/investigation.js";

export interface InvestigationListParams {
  page?: number;
  pageSize?: number;
  status?: WorkflowStatus;
  search?: string;
}

/** Same tenant-isolation contract as IncidentRepository — see its comment. */
export interface InvestigationRepository {
  list(organizationId: string, params: InvestigationListParams): Promise<PaginatedResult<Investigation>>;
  getById(organizationId: string, id: string): Promise<Investigation | null>;
  create(investigation: Investigation): Promise<Investigation>;
  update(organizationId: string, id: string, patch: Partial<Investigation>): Promise<Investigation | null>;
  addNote(organizationId: string, id: string, note: InvestigationNote): Promise<Investigation | null>;
}

export class InMemoryInvestigationRepository implements InvestigationRepository {
  private readonly investigationsById = new Map<string, Investigation>();

  async list(organizationId: string, params: InvestigationListParams): Promise<PaginatedResult<Investigation>> {
    let items = [...this.investigationsById.values()].filter((i) => i.organizationId === organizationId);
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

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

  async getById(organizationId: string, id: string): Promise<Investigation | null> {
    const investigation = this.investigationsById.get(id);
    if (!investigation || investigation.organizationId !== organizationId) return null;
    return { ...investigation };
  }

  async create(investigation: Investigation): Promise<Investigation> {
    this.investigationsById.set(investigation.id, investigation);
    return { ...investigation };
  }

  async update(organizationId: string, id: string, patch: Partial<Investigation>): Promise<Investigation | null> {
    const existing = this.investigationsById.get(id);
    if (!existing || existing.organizationId !== organizationId) return null;
    const updated: Investigation = { ...existing, ...patch, id: existing.id, organizationId: existing.organizationId };
    this.investigationsById.set(id, updated);
    return { ...updated };
  }

  async addNote(organizationId: string, id: string, note: InvestigationNote): Promise<Investigation | null> {
    const existing = this.investigationsById.get(id);
    if (!existing || existing.organizationId !== organizationId) return null;
    const updated: Investigation = {
      ...existing,
      notes: [note, ...existing.notes],
      updatedAt: new Date().toISOString(),
    };
    this.investigationsById.set(id, updated);
    return { ...updated };
  }

  /** Test/seed helper only — never exposed through the interface real callers depend on. */
  seed(investigation: Investigation): void {
    this.investigationsById.set(investigation.id, investigation);
  }
}
