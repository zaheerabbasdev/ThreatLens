import type { PageRequest, PaginatedResult, Report, ReportType } from "@/types";

export interface CreateReportInput {
  type: ReportType;
  title: string;
  periodStart: string;
  periodEnd: string;
}

export interface ReportService {
  list(params?: PageRequest & { type?: ReportType }): Promise<PaginatedResult<Report>>;
  getById(id: string): Promise<Report | null>;
  create(input: CreateReportInput, generatedBy: string): Promise<Report>;
}
