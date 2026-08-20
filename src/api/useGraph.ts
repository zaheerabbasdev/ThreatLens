import { useQuery } from "@tanstack/react-query";
import { services } from "@/services";
import { queryKeys } from "./keys";

export function useGraph() {
  return useQuery({
    queryKey: queryKeys.graph,
    queryFn: () => services.graph.getGraph(),
    staleTime: 60_000,
  });
}
