import type { AddIncidentNoteInput, IncidentListParams, IncidentService, IncidentSummary } from "@/services/incident.service";
import type { Incident, IncidentNote, PaginatedResult, WorkflowStatus } from "@/types";
import { apiRequest, apiRequestOrNull, requestWithMeta } from "./client";

export class ApiIncidentService implements IncidentService {
  async list(params?: IncidentListParams): Promise<PaginatedResult<Incident>> {
    const { data, meta } = await requestWithMeta<Incident[]>("/incidents", {
      query: {
        page: params?.page,
        pageSize: params?.pageSize,
        severity: params?.severity,
        status: params?.status,
        search: params?.search,
      },
    });
    return {
      items: data,
      total: (meta?.["total"] as number | undefined) ?? data.length,
      page: (meta?.["page"] as number | undefined) ?? params?.page ?? 1,
      pageSize: (meta?.["pageSize"] as number | undefined) ?? params?.pageSize ?? data.length,
    };
  }

  getById(id: string): Promise<Incident | null> {
    return apiRequestOrNull<Incident>(`/incidents/${id}`);
  }

  async getByIds(ids: string[]): Promise<Incident[]> {
    // No bulk-fetch endpoint on the backend — fetch each in parallel and
    // drop any that came back null (deleted/inaccessible in the moment
    // between the caller collecting IDs and this call resolving).
    const results = await Promise.all(ids.map((id) => this.getById(id)));
    return results.filter((incident): incident is Incident => incident !== null);
  }

  getSummary(): Promise<IncidentSummary> {
    return apiRequest<IncidentSummary>("/incidents/summary");
  }

  updateStatus(id: string, status: WorkflowStatus): Promise<Incident> {
    return apiRequest<Incident>(`/incidents/${id}/status`, { method: "PATCH", body: { status } });
  }

  assign(id: string, analystId: string | null): Promise<Incident> {
    return apiRequest<Incident>(`/incidents/${id}/assign`, { method: "PATCH", body: { analystId } });
  }

  addNote(id: string, input: AddIncidentNoteInput): Promise<IncidentNote> {
    // authorId/authorName are accepted by this interface for the mock's
    // sake but ignored here — the real backend resolves the actual author
    // from the authenticated session server-side, never from the request
    // body (see backend/README.md's Incidents section: "never trusted from
    // the request body").
    return apiRequest<IncidentNote>(`/incidents/${id}/notes`, { method: "POST", body: { content: input.content } });
  }
}
