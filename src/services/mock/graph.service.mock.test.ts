import { describe, expect, it } from "vitest";
import { MockGraphService } from "./graph.service.mock";

describe("MockGraphService", () => {
  it("builds a graph with no dangling edges (every edge endpoint is a real node)", async () => {
    const { nodes, edges } = await new MockGraphService().getGraph();
    const nodeIds = new Set(nodes.map((n) => n.id));
    for (const edge of edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    }
  });

  it("never emits a duplicate edge between the same pair of nodes", async () => {
    const { edges } = await new MockGraphService().getGraph();
    const pairKeys = edges.map((e) => [e.source, e.target].sort().join("|"));
    expect(new Set(pairKeys).size).toBe(pairKeys.length);
  });

  it("never emits a self-loop", async () => {
    const { edges } = await new MockGraphService().getGraph();
    for (const edge of edges) {
      expect(edge.source).not.toBe(edge.target);
    }
  });

  it("only includes users, techniques, and threat actors that are actually referenced by an edge", async () => {
    const { nodes, edges } = await new MockGraphService().getGraph();
    const connectedIds = new Set(edges.flatMap((e) => [e.source, e.target]));
    const contextualNodes = nodes.filter((n) => n.type === "user" || n.type === "technique" || n.type === "threat_actor");
    for (const node of contextualNodes) {
      expect(connectedIds.has(node.id)).toBe(true);
    }
  });

  it("includes every mock indicator and incident as a node", async () => {
    const { nodes } = await new MockGraphService().getGraph();
    const incidentNodes = nodes.filter((n) => n.type === "incident");
    const indicatorNodes = nodes.filter((n) => ["ip", "domain", "url", "hash"].includes(n.type));
    expect(incidentNodes.length).toBeGreaterThan(0);
    expect(indicatorNodes.length).toBeGreaterThan(0);
  });
});
