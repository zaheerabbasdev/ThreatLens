import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { services } from "@/services/mock";
import type { CreateInvestigationInput, InvestigationListParams } from "@/services/investigation.service";
import type { WorkflowStatus } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "./keys";

/** Frontend has no real network visibility — a real backend would stamp this server-side. */
const MOCK_CLIENT_IP = "203.0.113.10";

export function useInvestigationsList(params: InvestigationListParams) {
  return useQuery({
    queryKey: [...queryKeys.investigationList, params],
    queryFn: () => services.investigations.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useInvestigation(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.investigationDetail(id ?? ""),
    queryFn: () => services.investigations.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateInvestigation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: Omit<CreateInvestigationInput, "leadAnalystId">) => {
      if (!user) throw new Error("You must be signed in to open an investigation.");
      return services.investigations.create({ ...input, leadAnalystId: user.id });
    },
    onSuccess: async (investigation) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.investigationList });
      if (user) {
        await services.audit.record({
          actorId: user.id,
          actorName: user.name,
          action: "INVESTIGATION_CREATED",
          resourceType: "investigation",
          resourceId: investigation.id,
          ipAddress: MOCK_CLIENT_IP,
          result: "success",
          severity: "info",
        });
      }
    },
  });
}

function useInvestigationMutation<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
  investigationId: string,
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.investigationDetail(investigationId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.investigationList }),
      ]);
      if (user) {
        await services.audit.record({
          actorId: user.id,
          actorName: user.name,
          action: "INVESTIGATION_UPDATED",
          resourceType: "investigation",
          resourceId: investigationId,
          ipAddress: MOCK_CLIENT_IP,
          result: "success",
          severity: "low",
        });
      }
    },
  });
}

export function useUpdateInvestigationStatus(investigationId: string) {
  const { user } = useAuth();
  return useInvestigationMutation<WorkflowStatus>(
    (status) => services.investigations.updateStatus(investigationId, status, user?.name ?? "You"),
    investigationId,
  );
}

export function useAddInvestigationNote(investigationId: string) {
  const { user } = useAuth();
  return useInvestigationMutation<{ content: string; isFinding: boolean }>((input) => {
    if (!user) throw new Error("You must be signed in to add a note.");
    return services.investigations.addNote(investigationId, {
      ...input,
      authorId: user.id,
      authorName: user.name,
    });
  }, investigationId);
}

export function useLinkIncident(investigationId: string) {
  const { user } = useAuth();
  return useInvestigationMutation<string>(
    (incidentId) => services.investigations.linkIncident(investigationId, incidentId, user?.name ?? "You"),
    investigationId,
  );
}

export function useUnlinkIncident(investigationId: string) {
  const { user } = useAuth();
  return useInvestigationMutation<string>(
    (incidentId) => services.investigations.unlinkIncident(investigationId, incidentId, user?.name ?? "You"),
    investigationId,
  );
}

export function useLinkIndicator(investigationId: string) {
  const { user } = useAuth();
  return useInvestigationMutation<string>(
    (indicatorId) => services.investigations.linkIndicator(investigationId, indicatorId, user?.name ?? "You"),
    investigationId,
  );
}

export function useUnlinkIndicator(investigationId: string) {
  const { user } = useAuth();
  return useInvestigationMutation<string>(
    (indicatorId) => services.investigations.unlinkIndicator(investigationId, indicatorId, user?.name ?? "You"),
    investigationId,
  );
}
