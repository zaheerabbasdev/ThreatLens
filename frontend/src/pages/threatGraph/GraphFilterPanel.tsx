import { Icon } from "@/components/Icon";
import { GRAPH_NODE_TYPE_CONFIG, GRAPH_NODE_TYPE_ORDER } from "@/constants/graphNodeType";
import type { GraphNodeType } from "@/types";
import { cn } from "@/utils/cn";
import styles from "./GraphFilterPanel.module.css";

export interface GraphFilterPanelProps {
  counts: Record<GraphNodeType, number>;
  visibleTypes: Set<GraphNodeType>;
  onToggle: (type: GraphNodeType) => void;
}

export function GraphFilterPanel({ counts, visibleTypes, onToggle }: GraphFilterPanelProps) {
  return (
    <div className={styles.root} role="group" aria-label="Filter node types">
      {GRAPH_NODE_TYPE_ORDER.filter((type) => counts[type] > 0).map((type) => {
        const config = GRAPH_NODE_TYPE_CONFIG[type];
        const active = visibleTypes.has(type);
        return (
          <button
            key={type}
            type="button"
            className={cn(styles.chip, active && styles.active)}
            aria-pressed={active}
            onClick={() => onToggle(type)}
          >
            <Icon name={config.icon} size="xs" />
            {config.label}
            <span className={styles.count}>{counts[type]}</span>
          </button>
        );
      })}
    </div>
  );
}
