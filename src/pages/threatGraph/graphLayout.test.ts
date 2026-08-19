import { describe, expect, it } from "vitest";
import { layoutGraphNodes } from "./graphLayout";
import type { GraphNode } from "@/types";

function node(id: string, type: GraphNode["type"]): GraphNode {
  return { id, type, label: id };
}

describe("layoutGraphNodes", () => {
  it("places every node at a computed position", () => {
    const nodes = [node("ind_1", "ip"), node("inc_1", "incident"), node("user_1", "user")];
    const positions = layoutGraphNodes(nodes);
    expect(positions.size).toBe(3);
    for (const n of nodes) {
      expect(positions.has(n.id)).toBe(true);
    }
  });

  it("groups indicator types (ip/domain/url/hash) into the same column", () => {
    const nodes = [node("a", "ip"), node("b", "domain"), node("c", "url"), node("d", "hash")];
    const positions = layoutGraphNodes(nodes);
    const xs = new Set(nodes.map((n) => positions.get(n.id)!.x));
    expect(xs.size).toBe(1);
  });

  it("places later stages of the correlation chain in increasing columns", () => {
    const nodes = [node("ind", "ip"), node("inc", "incident"), node("usr", "user"), node("tech", "technique"), node("actor", "threat_actor")];
    const positions = layoutGraphNodes(nodes);
    const xIndicator = positions.get("ind")!.x;
    const xIncident = positions.get("inc")!.x;
    const xUser = positions.get("usr")!.x;
    const xTechnique = positions.get("tech")!.x;
    const xActor = positions.get("actor")!.x;
    expect(xIndicator).toBeLessThan(xIncident);
    expect(xIncident).toBeLessThan(xUser);
    expect(xUser).toBeLessThan(xTechnique);
    expect(xTechnique).toBeLessThan(xActor);
  });

  it("spreads nodes within a column vertically without overlapping", () => {
    const nodes = [node("a", "user"), node("b", "user"), node("c", "user")];
    const positions = layoutGraphNodes(nodes);
    const ys = nodes.map((n) => positions.get(n.id)!.y);
    expect(new Set(ys).size).toBe(3);
  });
});
