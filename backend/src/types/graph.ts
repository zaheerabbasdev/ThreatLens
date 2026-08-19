import type { Severity } from "./common.js";
import type { IndicatorType } from "./indicator.js";

export type GraphNodeType = IndicatorType | "incident" | "user" | "technique" | "threat_actor";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  subtitle?: string;
  severity?: Severity;
  href?: string;
}

export type GraphEdgeRelation = "correlates_with" | "observed_in" | "assigned_to" | "maps_to" | "attributed_to";

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: GraphEdgeRelation;
}

/** Mirrors the frontend's src/types/graph.ts exactly — this is an assembled view, not a persisted entity, so there's no organizationId field on it (the assembly itself is what's org-scoped; see graph.service.ts). */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
