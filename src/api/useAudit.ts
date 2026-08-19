import { useQuery } from "@tanstack/react-query";
import { services } from "@/services/mock";
import type { AuditListParams } from "@/services/audit.service";
import { queryKeys } from "./keys";

export function useAuditForResource(resourceId: string) {
  return useQuery({
    queryKey: queryKeys.auditForResource(resourceId),
    queryFn: async () => {
      const result = await services.audit.list({ pageSize: 50 });
      return result.items.filter((log) => log.resourceId === resourceId);
    },
  });
}

export function useAuditList(params: AuditListParams = {}) {
  return useQuery({
    queryKey: [...queryKeys.auditList, params],
    queryFn: () => services.audit.list(params),
  });
}

/** Actions performed BY a given user (as opposed to useAuditForResource, which
 * looks up actions taken ON a given resource). Used for a user's activity history. */
export function useAuditByActor(actorId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.auditByActor(actorId ?? ""),
    queryFn: async () => {
      const result = await services.audit.list({ pageSize: 50 });
      return result.items.filter((log) => log.actorId === actorId);
    },
    enabled: Boolean(actorId),
  });
}
