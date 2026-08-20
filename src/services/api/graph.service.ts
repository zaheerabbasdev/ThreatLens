import type { GraphService } from "@/services/graph.service";
import type { GraphData } from "@/types";
import { apiRequest } from "./client";

export class ApiGraphService implements GraphService {
  getGraph(): Promise<GraphData> {
    return apiRequest<GraphData>("/threat-graph");
  }
}
