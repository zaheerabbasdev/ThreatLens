import type { GraphNodeType } from "@/types";
import type { IconName } from "@/components/Icon";

export interface GraphNodeTypeConfig {
  label: string;
  icon: IconName;
  /** Indicator/incident nodes are colored by severity instead — this is the
   * fallback for node types that don't carry a severity field. */
  neutralColorVar: string;
}

export const GRAPH_NODE_TYPE_CONFIG: Record<GraphNodeType, GraphNodeTypeConfig> = {
  ip: { label: "IP Address", icon: "globe", neutralColorVar: "var(--severity-info)" },
  domain: { label: "Domain", icon: "link", neutralColorVar: "var(--severity-info)" },
  url: { label: "URL", icon: "link", neutralColorVar: "var(--severity-info)" },
  hash: { label: "File Hash", icon: "fingerprint", neutralColorVar: "var(--severity-info)" },
  incident: { label: "Incident", icon: "fire", neutralColorVar: "var(--severity-info)" },
  user: { label: "Analyst", icon: "user", neutralColorVar: "var(--text-secondary)" },
  technique: { label: "ATT&CK Technique", icon: "chess-board", neutralColorVar: "var(--accent-400)" },
  threat_actor: { label: "Threat Actor", icon: "user-secret", neutralColorVar: "var(--text-primary)" },
};

export const GRAPH_NODE_TYPE_ORDER: GraphNodeType[] = [
  "ip",
  "domain",
  "url",
  "hash",
  "incident",
  "user",
  "technique",
  "threat_actor",
];
