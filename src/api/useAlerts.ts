import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { services } from "@/services/mock";
import type { AlertListParams } from "@/services/alert.service";
import type { WorkflowStatus } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "./keys";

const MOCK_CLIENT_IP = "203.0.113.10";

export function useAlertsList(params: AlertListParams) {
  return useQuery({
    queryKey: [...queryKeys.alertList, params],
    queryFn: () => services.alerts.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAlert(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.alertDetail(id ?? ""),
    queryFn: () => services.alerts.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useUpdateAlertStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: WorkflowStatus }) =>
      services.alerts.updateStatus(id, status),
    onSuccess: async (alert) => {
      queryClient.setQueryData(queryKeys.alertDetail(alert.id), alert);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.alertList }),
        queryClient.invalidateQueries({ queryKey: queryKeys.alertSummary }),
      ]);
      if (user) {
        await services.audit.record({
          actorId: user.id,
          actorName: user.name,
          action: "ALERT_UPDATED",
          resourceType: "alert",
          resourceId: alert.id,
          ipAddress: MOCK_CLIENT_IP,
          result: "success",
          severity: "low",
        });
      }
    },
  });
}
