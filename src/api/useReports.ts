import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { services } from "@/services";
import type { CreateReportInput } from "@/services/report.service";
import type { ReportType } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "./keys";

const MOCK_CLIENT_IP = "203.0.113.10";

export function useReportsList(params: { page?: number; pageSize?: number; search?: string; type?: ReportType }) {
  return useQuery({
    queryKey: [...queryKeys.reportList, params],
    queryFn: () => services.reports.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useReport(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reportDetail(id ?? ""),
    queryFn: () => services.reports.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: CreateReportInput) => {
      if (!user) throw new Error("You must be signed in to generate a report.");
      return services.reports.create(input, user.name);
    },
    onSuccess: async (report) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.reportList });
      if (user) {
        await services.audit.record({
          actorId: user.id,
          actorName: user.name,
          action: "EXPORT_CREATED",
          resourceType: "report",
          resourceId: report.id,
          ipAddress: MOCK_CLIENT_IP,
          result: "success",
          severity: "info",
        });
      }
    },
  });
}
