import { Handle, Position, type NodeProps } from "reactflow";
import { Icon } from "@/components/Icon";
import { SEVERITY_CONFIG } from "@/constants/severity";
import { GRAPH_NODE_TYPE_CONFIG } from "@/constants/graphNodeType";
import type { GraphNode } from "@/types";
import { cn } from "@/utils/cn";
import styles from "./EntityNode.module.css";

export interface EntityNodeData {
  node: GraphNode;
  dimmed: boolean;
  selected: boolean;
}

export function EntityNode({ data }: NodeProps<EntityNodeData>) {
  const { node, dimmed, selected } = data;
  const typeConfig = GRAPH_NODE_TYPE_CONFIG[node.type];
  const colorVar = node.severity ? SEVERITY_CONFIG[node.severity].colorVar : typeConfig.neutralColorVar;

  return (
    <div
      className={cn(styles.root, dimmed && styles.dimmed, selected && styles.selected)}
      style={{ borderColor: selected ? colorVar : undefined }}
    >
      <Handle type="target" position={Position.Left} className={styles.handle} />
      <span className={styles.icon} style={{ color: colorVar }}>
        <Icon name={typeConfig.icon} size="sm" />
      </span>
      <span className={styles.text}>
        <span className={styles.label} title={node.label}>
          {node.label}
        </span>
        {node.subtitle && (
          <span className={styles.subtitle} title={node.subtitle}>
            {node.subtitle}
          </span>
        )}
      </span>
      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  );
}
