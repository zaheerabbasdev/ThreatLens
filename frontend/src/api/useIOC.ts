import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { services } from "@/services";
import type { IOCListParams, IOCSubmissionInput } from "@/services/ioc.service";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "./keys";

const MOCK_CLIENT_IP = "203.0.113.10";

export function useIOCList(params: IOCListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.iocList, params],
    queryFn: () => services.ioc.list(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function useIOC(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.iocDetail(id ?? ""),
    queryFn: () => services.ioc.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useSubmitIOC() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: IOCSubmissionInput) => services.ioc.submit(input),
    onSuccess: async (indicator) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.iocList });
      if (user) {
        await services.audit.record({
          actorId: user.id,
          actorName: user.name,
          action: "IOC_SUBMITTED",
          resourceType: "indicator",
          resourceId: indicator.id,
          ipAddress: MOCK_CLIENT_IP,
          result: "success",
          severity: "info",
        });
      }
    },
  });
}

export function useEnrichIOC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, force = false }: { id: string; force?: boolean }) => services.ioc.enrich(id, force),
    onSuccess: async (indicator) => {
      queryClient.setQueryData(queryKeys.iocDetail(indicator.id), indicator);
      await queryClient.invalidateQueries({ queryKey: queryKeys.iocList });
    },
  });
}
