import type { IOCListParams, IOCService, IOCSubmissionInput } from "@/services/ioc.service";
import type { Indicator, PaginatedResult } from "@/types";
import { apiRequest, apiRequestOrNull, requestWithMeta } from "./client";

export class ApiIOCService implements IOCService {
  submit(input: IOCSubmissionInput): Promise<Indicator> {
    return apiRequest<Indicator>("/ioc", { method: "POST", body: input });
  }

  async list(params?: IOCListParams): Promise<PaginatedResult<Indicator>> {
    const { data, meta } = await requestWithMeta<Indicator[]>("/ioc", {
      query: { page: params?.page, pageSize: params?.pageSize, type: params?.type, severity: params?.severity, search: params?.search },
    });
    return {
      items: data,
      total: (meta?.["total"] as number | undefined) ?? data.length,
      page: (meta?.["page"] as number | undefined) ?? params?.page ?? 1,
      pageSize: (meta?.["pageSize"] as number | undefined) ?? params?.pageSize ?? data.length,
    };
  }

  getById(id: string): Promise<Indicator | null> {
    return apiRequestOrNull<Indicator>(`/ioc/${id}`);
  }
}
