import { useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { EntityNode, type EntityNodeData } from "./nodes/EntityNode";
import { layoutGraphNodes } from "./graphLayout";
import { SEVERITY_HEX } from "@/constants/chartColors";
import type { GraphData, GraphNodeType } from "@/types";
import styles from "./GraphCanvas.module.css";

const nodeTypes = { entity: EntityNode };

function neutralHex(type: GraphNodeType): string {
  switch (type) {
    case "user":
      return "#98a5b8";
    case "technique":
      return "#5590f2";
    case "threat_actor":
      return "#e7ecf3";
    default:
      return "#8a94a6";
  }
}

export interface GraphCanvasProps {
  data: GraphData;
  visibleTypes: Set<GraphNodeType>;
  selectedNodeId: string | null;
  connectedNodeIds: Set<string>;
  focusNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}

export function GraphCanvas({
  data,
  visibleTypes,
  selectedNodeId,
  connectedNodeIds,
  focusNodeId,
  onSelectNode,
}: GraphCanvasProps) {
  const { setCenter, getNode } = useReactFlow();
  const positions = useMemo(() => layoutGraphNodes(data.nodes), [data.nodes]);

  const visibleNodeIds = useMemo(
    () => new Set(data.nodes.filter((n) => visibleTypes.has(n.type)).map((n) => n.id)),
    [data.nodes, visibleTypes],
  );

  const flowNodes: Node<EntityNodeData>[] = useMemo(
    () =>
      data.nodes
        .filter((node) => visibleNodeIds.has(node.id))
        .map((node) => ({
          id: node.id,
          type: "entity",
          position: positions.get(node.id) ?? { x: 0, y: 0 },
          data: {
            node,
            selected: node.id === selectedNodeId,
            dimmed: selectedNodeId !== null && !connectedNodeIds.has(node.id) && node.id !== selectedNodeId,
          },
        })),
    [data.nodes, positions, visibleNodeIds, selectedNodeId, connectedNodeIds],
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      data.edges
        .filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
        .map((edge) => {
          const touchesSelection =
            selectedNodeId !== null && (edge.source === selectedNodeId || edge.target === selectedNodeId);
          const dimmed = selectedNodeId !== null && !touchesSelection;
          return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            style: {
              stroke: touchesSelection ? "var(--accent-500)" : "var(--border-strong)",
              strokeWidth: touchesSelection ? 2 : 1,
              opacity: dimmed ? 0.15 : 1,
            },
          };
        }),
    [data.edges, visibleNodeIds, selectedNodeId],
  );

  useEffect(() => {
    if (!focusNodeId) return;
    const node = getNode(focusNodeId);
    if (!node) return;
    setCenter(node.position.x + 110, node.position.y + 20, { zoom: 1, duration: 400 });
  }, [focusNodeId, getNode, setCenter]);

  return (
    <div className={styles.root}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={(_event, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        // This is a read-only correlation view, not a diagram editor — the
        // layout is deterministic and meaningful, so nodes shouldn't be
        // draggable or connectable by hand.
        nodesDraggable={false}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="#232b36" gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(6, 9, 13, 0.75)"
          nodeColor={(n) => {
            const nodeData = n.data as EntityNodeData;
            if (nodeData.node.severity) return SEVERITY_HEX[nodeData.node.severity];
            return neutralHex(nodeData.node.type);
          }}
        />
      </ReactFlow>
    </div>
  );
}
