import { useQuery } from "@tanstack/react-query";
import { services } from "@/services";
import { queryKeys } from "./keys";

export function useIncidentSummary() {
  return useQuery({
    queryKey: queryKeys.incidentSummary,
    queryFn: () => services.incidents.getSummary(),
  });
}

export function useAlertSummary() {
  return useQuery({
    queryKey: queryKeys.alertSummary,
    queryFn: () => services.alerts.getSummary(),
  });
}

export function useOrgRiskScore() {
  return useQuery({
    queryKey: queryKeys.orgRiskScore,
    queryFn: () => services.threat.getOrgRiskScore(),
  });
}

export function useThreatActivityTimeline() {
  return useQuery({
    queryKey: queryKeys.activityTimeline,
    queryFn: () => services.threat.listActivityTimeline(),
  });
}

export function useTopIndicators(limit = 5) {
  return useQuery({
    queryKey: [...queryKeys.topIndicators, limit],
    queryFn: () => services.threat.listTopIndicators(limit),
  });
}

export function useTopTechniques(limit = 5) {
  return useQuery({
    queryKey: [...queryKeys.topTechniques, limit],
    queryFn: () => services.threat.listTopTechniques(limit),
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: queryKeys.systemHealth,
    queryFn: () => services.threat.getSystemHealth(),
  });
}
