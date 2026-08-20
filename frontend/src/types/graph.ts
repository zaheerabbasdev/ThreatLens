import type { Severity } from "./common";
import type { IndicatorType } from "./indicator";

export type GraphNodeType = IndicatorType | "incident" | "user" | "technique" | "threat_actor";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  subtitle?: string;
  severity?: Severity;
  /** In-app route for "view full details", when one exists. */
  href?: string;
}

export type GraphEdgeRelation =
  | "correlates_with"
  | "observed_in"
  | "assigned_to"
  | "maps_to"
  | "attributed_to";

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: GraphEdgeRelation;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
