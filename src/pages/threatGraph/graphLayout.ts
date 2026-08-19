import type { GraphNode, GraphNodeType } from "@/types";

/**
 * Deterministic column layout, left to right, following the correlation
 * chain the rest of the app already tells: indicators → incidents →
 * analysts / techniques → threat actors (spec §41). No layout dependency
 * required — the graph is small enough that a fixed grouping reads more
 * predictably than a force simulation would.
 */
const COLUMN_X: Record<GraphNodeType, number> = {
  ip: 0,
  domain: 0,
  url: 0,
  hash: 0,
  incident: 340,
  user: 680,
  technique: 1000,
  threat_actor: 1340,
};

const ROW_HEIGHT = 96;

export interface NodePosition {
  x: number;
  y: number;
}

export function layoutGraphNodes(nodes: GraphNode[]): Map<string, NodePosition> {
  const columns = new Map<number, GraphNode[]>();
  for (const node of nodes) {
    const x = COLUMN_X[node.type];
    const bucket = columns.get(x) ?? [];
    bucket.push(node);
    columns.set(x, bucket);
  }

  const positions = new Map<string, NodePosition>();
  for (const [x, columnNodes] of columns) {
    const totalHeight = (columnNodes.length - 1) * ROW_HEIGHT;
    columnNodes.forEach((node, index) => {
      positions.set(node.id, { x, y: index * ROW_HEIGHT - totalHeight / 2 });
    });
  }
  return positions;
}
