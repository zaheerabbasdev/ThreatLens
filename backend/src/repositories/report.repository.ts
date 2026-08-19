import type { PaginatedResult } from "../types/common.js";
import type { Report, ReportType } from "../types/report.js";

export interface ReportListParams {
  page?: number;
  pageSize?: number;
  type?: ReportType;
  search?: string;
}

/** Same tenant-isolation contract as IncidentRepository — see its comment. Reports are immutable once created — there is no update method. */
export interface ReportRepository {
  list(organizationId: string, params: ReportListParams): Promise<PaginatedResult<Report>>;
  getById(organizationId: string, id: string): Promise<Report | null>;
  create(report: Report): Promise<Report>;
}

export class InMemoryReportRepository implements ReportRepository {
  private readonly reportsById = new Map<string, Report>();

  async list(organizationId: string, params: ReportListParams): Promise<PaginatedResult<Report>> {
    let items = [...this.reportsById.values()].filter((r) => r.organizationId === organizationId);
    items.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

    if (params.type) items = items.filter((r) => r.type === params.type);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter((r) => r.title.toLowerCase().includes(q));
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize).map((r) => ({ ...r })), total: items.length, page, pageSize };
  }

  async getById(organizationId: string, id: string): Promise<Report | null> {
    const report = this.reportsById.get(id);
    if (!report || report.organizationId !== organizationId) return null;
    return { ...report };
  }

  async create(report: Report): Promise<Report> {
    this.reportsById.set(report.id, report);
    return { ...report };
  }

  /** Test/seed helper only — never exposed through the interface real callers depend on. */
  seed(report: Report): void {
    this.reportsById.set(report.id, report);
  }
}
