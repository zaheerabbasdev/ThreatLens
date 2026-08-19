import type { Severity, PaginatedResult } from "../types/common.js";
import type { Indicator, IndicatorType } from "../types/indicator.js";

export interface IndicatorListParams {
  page?: number;
  pageSize?: number;
  type?: IndicatorType;
  severity?: Severity;
  search?: string;
}

/** Same tenant-isolation contract as IncidentRepository — see its comment. */
export interface IndicatorRepository {
  list(organizationId: string, params: IndicatorListParams): Promise<PaginatedResult<Indicator>>;
  getById(organizationId: string, id: string): Promise<Indicator | null>;
  create(indicator: Indicator): Promise<Indicator>;
}

export class InMemoryIndicatorRepository implements IndicatorRepository {
  private readonly indicatorsById = new Map<string, Indicator>();

  async list(organizationId: string, params: IndicatorListParams): Promise<PaginatedResult<Indicator>> {
    let items = [...this.indicatorsById.values()].filter((i) => i.organizationId === organizationId);
    items.sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

    if (params.type) items = items.filter((i) => i.type === params.type);
    if (params.severity) items = items.filter((i) => i.severity === params.severity);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter((i) => i.value.toLowerCase().includes(q));
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize).map((i) => ({ ...i }));

    return { items: pageItems, total: items.length, page, pageSize };
  }

  async getById(organizationId: string, id: string): Promise<Indicator | null> {
    const indicator = this.indicatorsById.get(id);
    if (!indicator || indicator.organizationId !== organizationId) return null;
    return { ...indicator };
  }

  async create(indicator: Indicator): Promise<Indicator> {
    this.indicatorsById.set(indicator.id, indicator);
    return { ...indicator };
  }

  /** Test/seed helper only — never exposed through the interface real callers depend on. */
  seed(indicator: Indicator): void {
    this.indicatorsById.set(indicator.id, indicator);
  }
}
