import { Link } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/Button";
import { SeverityBadge } from "@/components/SeverityBadge";
import { EmptyState } from "@/components/EmptyState";
import { SEVERITY_CONFIG } from "@/constants/severity";
import { GRAPH_NODE_TYPE_CONFIG } from "@/constants/graphNodeType";
import type { GraphEdgeRelation, GraphNode } from "@/types";
import styles from "./GraphSidePanel.module.css";

const RELATION_LABEL: Record<GraphEdgeRelation, string> = {
  correlates_with: "Correlates with",
  observed_in: "Observed in",
  assigned_to: "Assigned to",
  maps_to: "Maps to",
  attributed_to: "Attributed to",
};

export interface GraphConnection {
  node: GraphNode;
  relation: GraphEdgeRelation;
}

export interface GraphSidePanelProps {
  node: GraphNode | null;
  connections: GraphConnection[];
  onSelectNode: (id: string) => void;
}

export function GraphSidePanel({ node, connections, onSelectNode }: GraphSidePanelProps) {
  if (!node) {
    return (
      <aside className={styles.root} aria-label="Node details">
        <EmptyState
          icon="diagram-project"
          title="Select a node"
          description="Click any node in the graph to inspect its details and relationships."
        />
      </aside>
    );
  }

  const typeConfig = GRAPH_NODE_TYPE_CONFIG[node.type];
  const colorVar = node.severity ? SEVERITY_CONFIG[node.severity].colorVar : typeConfig.neutralColorVar;

  return (
    <aside className={styles.root} aria-label="Node details">
      <div className={styles.header}>
        <span className={styles.icon} style={{ color: colorVar }}>
          <Icon name={typeConfig.icon} size="md" />
        </span>
        <div className={styles.headerText}>
          <span className={styles.typeLabel}>{typeConfig.label}</span>
          <h2 className={styles.label}>{node.label}</h2>
        </div>
      </div>

      {node.subtitle && <p className={styles.subtitle}>{node.subtitle}</p>}
      {node.severity && (
        <div className={styles.severityRow}>
          <SeverityBadge severity={node.severity} />
        </div>
      )}

      {node.href && (
        <Link to={node.href} className={styles.viewLink}>
          <Button variant="secondary" size="sm" iconRight="arrow-right" fullWidth>
            View full details
          </Button>
        </Link>
      )}

      <div className={styles.connections}>
        <p className={styles.connectionsTitle}>
          {connections.length === 0 ? "No connections" : `${connections.length} connection${connections.length === 1 ? "" : "s"}`}
        </p>
        {connections.length === 0 ? (
          <p className={styles.connectionsEmpty}>This node isn't linked to anything else in the graph yet.</p>
        ) : (
          <ul className={styles.connectionList}>
            {connections.map(({ node: connectedNode, relation }) => {
              const connectedConfig = GRAPH_NODE_TYPE_CONFIG[connectedNode.type];
              const connectedColor = connectedNode.severity
                ? SEVERITY_CONFIG[connectedNode.severity].colorVar
                : connectedConfig.neutralColorVar;
              return (
                <li key={connectedNode.id}>
                  <button
                    type="button"
                    className={styles.connectionItem}
                    onClick={() => onSelectNode(connectedNode.id)}
                  >
                    <span className={styles.connectionIcon} style={{ color: connectedColor }}>
                      <Icon name={connectedConfig.icon} size="xs" />
                    </span>
                    <span className={styles.connectionText}>
                      <span className={styles.connectionLabel}>{connectedNode.label}</span>
                      <span className={styles.connectionRelation}>{RELATION_LABEL[relation]}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
