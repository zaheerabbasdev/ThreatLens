import type {
  AddInvestigationNoteInput,
  CreateInvestigationInput,
  InvestigationListParams,
  InvestigationService,
} from "@/services/investigation.service";
import type { Investigation, InvestigationNote, PaginatedResult, WorkflowStatus } from "@/types";
import { apiRequest, apiRequestOrNull, requestWithMeta } from "./client";

export class ApiInvestigationService implements InvestigationService {
  async list(params?: InvestigationListParams): Promise<PaginatedResult<Investigation>> {
    const { data, meta } = await requestWithMeta<Investigation[]>("/investigations", {
      query: { page: params?.page, pageSize: params?.pageSize, status: params?.status, search: params?.search },
    });
    return {
      items: data,
      total: (meta?.["total"] as number | undefined) ?? data.length,
      page: (meta?.["page"] as number | undefined) ?? params?.page ?? 1,
      pageSize: (meta?.["pageSize"] as number | undefined) ?? params?.pageSize ?? data.length,
    };
  }

  getById(id: string): Promise<Investigation | null> {
    return apiRequestOrNull<Investigation>(`/investigations/${id}`);
  }

  create(input: CreateInvestigationInput): Promise<Investigation> {
    return apiRequest<Investigation>("/investigations", { method: "POST", body: input });
  }

  // `actorName` is accepted by this interface for the mock's sake but
  // ignored below — the real backend resolves the actual actor from the
  // authenticated session server-side on every one of these, never from
  // the request body (see backend/README.md's Investigations section).
  updateStatus(id: string, status: WorkflowStatus): Promise<Investigation> {
    return apiRequest<Investigation>(`/investigations/${id}/status`, { method: "PATCH", body: { status } });
  }

  addNote(id: string, input: AddInvestigationNoteInput): Promise<InvestigationNote> {
    return apiRequest<InvestigationNote>(`/investigations/${id}/notes`, {
      method: "POST",
      body: { content: input.content, isFinding: input.isFinding },
    });
  }

  linkIncident(id: string, incidentId: string): Promise<Investigation> {
    return apiRequest<Investigation>(`/investigations/${id}/incidents`, { method: "POST", body: { incidentId } });
  }

  unlinkIncident(id: string, incidentId: string): Promise<Investigation> {
    return apiRequest<Investigation>(`/investigations/${id}/incidents/${incidentId}`, { method: "DELETE" });
  }

  linkIndicator(id: string, indicatorId: string): Promise<Investigation> {
    return apiRequest<Investigation>(`/investigations/${id}/indicators`, { method: "POST", body: { indicatorId } });
  }

  unlinkIndicator(id: string, indicatorId: string): Promise<Investigation> {
    return apiRequest<Investigation>(`/investigations/${id}/indicators/${indicatorId}`, { method: "DELETE" });
  }
}
