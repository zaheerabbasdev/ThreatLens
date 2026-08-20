import { useQuery } from "@tanstack/react-query";
import { services } from "@/services";
import type { MitreTechniqueListParams } from "@/services/mitre.service";
import { queryKeys } from "./keys";

export function useMitreTactics() {
  return useQuery({
    queryKey: queryKeys.mitreTactics,
    queryFn: () => services.mitre.listTactics(),
    staleTime: 5 * 60_000,
  });
}

export function useMitreTechniques(params: MitreTechniqueListParams) {
  return useQuery({
    queryKey: [...queryKeys.mitreTechniqueList, params],
    queryFn: () => services.mitre.listTechniques(params),
  });
}

export function useMitreTechnique(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mitreTechniqueDetail(id ?? ""),
    queryFn: () => services.mitre.getTechniqueById(id as string),
    enabled: Boolean(id),
  });
}
