import type { AlertListParams, AlertService, AlertSummary } from "@/services/alert.service";
import type { Alert, PaginatedResult, WorkflowStatus } from "@/types";
import { apiRequest, apiRequestOrNull, requestWithMeta } from "./client";

export class ApiAlertService implements AlertService {
  async list(params?: AlertListParams): Promise<PaginatedResult<Alert>> {
    const { data, meta } = await requestWithMeta<Alert[]>("/alerts", {
      query: { page: params?.page, pageSize: params?.pageSize, severity: params?.severity, status: params?.status, search: params?.search },
    });
    return {
      items: data,
      total: (meta?.["total"] as number | undefined) ?? data.length,
      page: (meta?.["page"] as number | undefined) ?? params?.page ?? 1,
      pageSize: (meta?.["pageSize"] as number | undefined) ?? params?.pageSize ?? data.length,
    };
  }

  getById(id: string): Promise<Alert | null> {
    return apiRequestOrNull<Alert>(`/alerts/${id}`);
  }

  getSummary(): Promise<AlertSummary> {
    return apiRequest<AlertSummary>("/alerts/summary");
  }

  updateStatus(id: string, status: WorkflowStatus): Promise<Alert> {
    return apiRequest<Alert>(`/alerts/${id}/status`, { method: "PATCH", body: { status } });
  }
}
