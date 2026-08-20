import type { ResponseAction } from "../types/responseAction.js";

/** Same tenant-isolation contract as every other repository (spec §19/§20). */
export interface ResponseActionRepository {
  create(action: ResponseAction): Promise<ResponseAction>;
  listByIncident(organizationId: string, incidentId: string): Promise<ResponseAction[]>;
  getById(organizationId: string, id: string): Promise<ResponseAction | null>;
  update(organizationId: string, id: string, patch: Partial<ResponseAction>): Promise<ResponseAction | null>;
}

export class InMemoryResponseActionRepository implements ResponseActionRepository {
  private readonly actionsById = new Map<string, ResponseAction>();

  async create(action: ResponseAction): Promise<ResponseAction> {
    this.actionsById.set(action.id, action);
    return { ...action };
  }

  async listByIncident(organizationId: string, incidentId: string): Promise<ResponseAction[]> {
    return [...this.actionsById.values()]
      .filter((a) => a.organizationId === organizationId && a.incidentId === incidentId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  async getById(organizationId: string, id: string): Promise<ResponseAction | null> {
    const action = this.actionsById.get(id);
    if (!action || action.organizationId !== organizationId) return null;
    return { ...action };
  }

  async update(organizationId: string, id: string, patch: Partial<ResponseAction>): Promise<ResponseAction | null> {
    const existing = this.actionsById.get(id);
    if (!existing || existing.organizationId !== organizationId) return null;
    const updated: ResponseAction = { ...existing, ...patch, id: existing.id, organizationId: existing.organizationId };
    this.actionsById.set(id, updated);
    return { ...updated };
  }
}
