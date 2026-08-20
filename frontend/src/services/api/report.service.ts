import type { CreateReportInput, ReportService } from "@/services/report.service";
import type { PageRequest, PaginatedResult, Report, ReportType } from "@/types";
import { apiRequest, apiRequestOrNull, requestWithMeta } from "./client";

export class ApiReportService implements ReportService {
  async list(params?: PageRequest & { type?: ReportType }): Promise<PaginatedResult<Report>> {
    const { data, meta } = await requestWithMeta<Report[]>("/reports", {
      query: { page: params?.page, pageSize: params?.pageSize, type: params?.type, search: params?.search },
    });
    return {
      items: data,
      total: (meta?.["total"] as number | undefined) ?? data.length,
      page: (meta?.["page"] as number | undefined) ?? params?.page ?? 1,
      pageSize: (meta?.["pageSize"] as number | undefined) ?? params?.pageSize ?? data.length,
    };
  }

  getById(id: string): Promise<Report | null> {
    return apiRequestOrNull<Report>(`/reports/${id}`);
  }

  // `generatedBy` is accepted for the mock's sake but ignored — the real
  // backend resolves the generating user from the authenticated session.
  create(input: CreateReportInput): Promise<Report> {
    return apiRequest<Report>("/reports", { method: "POST", body: input });
  }
}
