import { useQuery } from "@tanstack/react-query";
import { services } from "@/services/mock";
import { queryKeys } from "./keys";

export function useRiskScore(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.riskScore(id ?? ""),
    queryFn: () => services.threat.getRiskScoreById(id as string),
    enabled: Boolean(id),
  });
}

export function useIndicatorsByIds(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.indicatorsByIds(ids),
    queryFn: () => services.threat.getIndicatorsByIds(ids),
    enabled: ids.length > 0,
  });
}

export function useTechniquesByIds(ids: string[]) {
  return useQuery({
    queryKey: queryKeys.techniquesByIds(ids),
    queryFn: () => services.threat.getTechniquesByIds(ids),
    enabled: ids.length > 0,
  });
}
