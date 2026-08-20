import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { services } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { queryKeys } from "./keys";

const MOCK_CLIENT_IP = "203.0.113.10";

export function useAskAssistant() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: (message: string) => services.ai.askAssistant(message),
    onSuccess: async () => {
      if (user) {
        await services.audit.record({
          actorId: user.id,
          actorName: user.name,
          action: "AI_ANALYSIS_REQUESTED",
          resourceType: "ai_assistant",
          ipAddress: MOCK_CLIENT_IP,
          result: "success",
          severity: "info",
        });
      }
    },
  });
}

export function useIncidentAIAnalysis(incidentId: string) {
  return useQuery({
    queryKey: queryKeys.incidentAnalysis(incidentId),
    queryFn: () => services.ai.analyzeIncident(incidentId),
  });
}

export function useIncidentRecommendations(incidentId: string) {
  return useQuery({
    queryKey: queryKeys.incidentRecommendations(incidentId),
    queryFn: () => services.ai.generateRecommendations(incidentId),
  });
}

export function useReviewRecommendation(incidentId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      recommendationId,
      status,
    }: {
      recommendationId: string;
      status: "approved" | "rejected";
    }) => {
      if (!user) throw new Error("You must be signed in to review a recommendation.");
      return services.ai.reviewRecommendation(recommendationId, status, user.id);
    },
    onSuccess: async (_recommendation, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.incidentRecommendations(incidentId) });
      if (user) {
        await services.audit.record({
          actorId: user.id,
          actorName: user.name,
          action: variables.status === "approved" ? "RECOMMENDATION_APPROVED" : "RECOMMENDATION_REJECTED",
          resourceType: "recommendation",
          resourceId: variables.recommendationId,
          ipAddress: MOCK_CLIENT_IP,
          result: "success",
          severity: "medium",
        });
      }
    },
  });
}
