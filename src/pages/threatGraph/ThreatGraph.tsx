import { useMemo, useState, type FormEvent } from "react";
import { ReactFlowProvider } from "reactflow";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/Input";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { AlertBanner } from "@/components/Alert";
import { GraphCanvas } from "./GraphCanvas";
import { GraphSidePanel, type GraphConnection } from "./GraphSidePanel";
import { GraphFilterPanel } from "./GraphFilterPanel";
import { useGraph } from "@/api/useGraph";
import { GRAPH_NODE_TYPE_ORDER } from "@/constants/graphNodeType";
import type { GraphNodeType } from "@/types";
import styles from "./ThreatGraph.module.css";

export function ThreatGraph() {
  const { data, isLoading, isError } = useGraph();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<Set<GraphNodeType> | null>(null);
  const [search, setSearch] = useState("");
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  const nodesById = useMemo(() => new Map(data?.nodes.map((n) => [n.id, n]) ?? []), [data]);

  const counts = useMemo(() => {
    const base = Object.fromEntries(GRAPH_NODE_TYPE_ORDER.map((t) => [t, 0])) as Record<GraphNodeType, number>;
    for (const node of data?.nodes ?? []) base[node.type] += 1;
    return base;
  }, [data]);

  const activeTypes = visibleTypes ?? new Set(GRAPH_NODE_TYPE_ORDER);

  const connections: GraphConnection[] = useMemo(() => {
    if (!selectedNodeId || !data) return [];
    return data.edges
      .filter((edge) => edge.source === selectedNodeId || edge.target === selectedNodeId)
      .map((edge) => {
        const otherId = edge.source === selectedNodeId ? edge.target : edge.source;
        const node = nodesById.get(otherId);
        return node ? { node, relation: edge.relation } : null;
      })
      .filter((c): c is GraphConnection => c !== null);
  }, [selectedNodeId, data, nodesById]);

  const connectedNodeIds = useMemo(() => new Set(connections.map((c) => c.node.id)), [connections]);
  const selectedNode = selectedNodeId ? (nodesById.get(selectedNodeId) ?? null) : null;

  function handleSelectNode(id: string | null) {
    setSelectedNodeId(id);
    setFocusNodeId(id);
  }

  function handleToggleType(type: GraphNodeType) {
    setVisibleTypes((prev) => {
      const next = new Set(prev ?? GRAPH_NODE_TYPE_ORDER);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (!data || !search.trim()) return;
    const query = search.trim().toLowerCase();
    const match = data.nodes.find(
      (n) => n.label.toLowerCase().includes(query) || n.subtitle?.toLowerCase().includes(query),
    );
    if (match) handleSelectNode(match.id);
  }

  return (
    <div className={styles.root}>
      <PageHeader
        title="Threat Graph"
        subtitle="Explore correlations between indicators, incidents, analysts, techniques, and threat actors."
      />

      {isLoading ? (
        <Skeleton height={560} />
      ) : isError || !data ? (
        <AlertBanner tone="danger" title="Couldn't load the threat graph">
          Something went wrong assembling the graph. Try reloading the page.
        </AlertBanner>
      ) : data.nodes.length === 0 ? (
        <EmptyState
          icon="diagram-project"
          title="Nothing to graph yet"
          description="Once incidents and indicators are correlated, their relationships will appear here."
        />
      ) : (
        <>
          <div className={styles.toolbar}>
            <form className={styles.search} onSubmit={handleSearchSubmit}>
              <Input
                label="Focus a node"
                hideLabel
                iconLeft="magnifying-glass"
                placeholder="Search by value, title, or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <GraphFilterPanel counts={counts} visibleTypes={activeTypes} onToggle={handleToggleType} />
          </div>

          <div className={styles.canvasArea}>
            <ReactFlowProvider>
              <GraphCanvas
                data={data}
                visibleTypes={activeTypes}
                selectedNodeId={selectedNodeId}
                connectedNodeIds={connectedNodeIds}
                focusNodeId={focusNodeId}
                onSelectNode={handleSelectNode}
              />
            </ReactFlowProvider>
            <GraphSidePanel node={selectedNode} connections={connections} onSelectNode={handleSelectNode} />
          </div>
        </>
      )}
    </div>
  );
}
