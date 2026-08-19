import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { services } from "@/services/mock";
import type { IncidentListParams } from "@/services/incident.service";
import type { WorkflowStatus } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "./keys";

/** Frontend has no real network visibility — a real backend would stamp this server-side. */
const MOCK_CLIENT_IP = "203.0.113.10";

export function useIncidentsList(params: IncidentListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.incidentList, params],
    queryFn: () => services.incidents.list(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useIncident(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.incidentDetail(id ?? ""),
    queryFn: () => services.incidents.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useIncidentsByIds(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.incidentsByIds(ids),
    queryFn: () => services.incidents.getByIds(ids),
    enabled: ids.length > 0,
  });
}

export function useUpdateIncidentStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: WorkflowStatus }) =>
      services.incidents.updateStatus(id, status),
    onSuccess: async (incident) => {
      queryClient.setQueryData(queryKeys.incidentDetail(incident.id), incident);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.incidentList }),
        queryClient.invalidateQueries({ queryKey: queryKeys.incidentSummary }),
      ]);
      if (user) {
        await services.audit.record({
          actorId: user.id,
          actorName: user.name,
          action: "INCIDENT_UPDATED",
          resourceType: "incident",
          resourceId: incident.id,
          ipAddress: MOCK_CLIENT_IP,
          result: "success",
          severity: "low",
        });
      }
    },
  });
}

export function useAssignIncident() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, analystId }: { id: string; analystId: string | null }) =>
      services.incidents.assign(id, analystId),
    onSuccess: async (incident) => {
      queryClient.setQueryData(queryKeys.incidentDetail(incident.id), incident);
      await queryClient.invalidateQueries({ queryKey: queryKeys.incidentList });
      if (user) {
        await services.audit.record({
          actorId: user.id,
          actorName: user.name,
          action: "INCIDENT_UPDATED",
          resourceType: "incident",
          resourceId: incident.id,
          ipAddress: MOCK_CLIENT_IP,
          result: "success",
          severity: "info",
        });
      }
    },
  });
}

export function useAddIncidentNote(incidentId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (content: string) => {
      if (!user) throw new Error("You must be signed in to add a note.");
      return services.incidents.addNote(incidentId, {
        content,
        authorId: user.id,
        authorName: user.name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.incidentDetail(incidentId) });
    },
  });
}
