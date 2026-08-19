import type { GraphService } from "@/services/graph.service";
import type { GraphData, GraphEdge, GraphEdgeRelation, GraphNode } from "@/types";
import { MOCK_INDICATORS } from "@/mocks/indicators";
import { MOCK_INCIDENTS } from "@/mocks/incidents";
import { MOCK_USERS } from "@/mocks/identity";
import { MOCK_TECHNIQUES } from "@/mocks/mitre";
import { MOCK_THREAT_ACTORS } from "@/mocks/threatActors";
import { formatShortId, truncate, truncateMiddle } from "@/utils/format";
import { delay } from "./util";

function buildGraph(): GraphData {
  const nodes: GraphNode[] = [];
  const nodeIds = new Set<string>();

  function addNode(node: GraphNode) {
    if (nodeIds.has(node.id)) return;
    nodeIds.add(node.id);
    nodes.push(node);
  }

  for (const indicator of MOCK_INDICATORS) {
    addNode({
      id: indicator.id,
      type: indicator.type,
      label: truncateMiddle(indicator.value, 16),
      subtitle: indicator.type.toUpperCase(),
      severity: indicator.severity,
      href: `/app/threat-intel/${indicator.id}`,
    });
  }

  for (const incident of MOCK_INCIDENTS) {
    addNode({
      id: incident.id,
      type: "incident",
      label: formatShortId(incident.id),
      subtitle: truncate(incident.title, 40),
      severity: incident.severity,
      href: `/app/incidents/${incident.id}`,
    });
  }

  // Only include techniques/users/actors that actually connect to
  // something — an unreferenced node would just be visual noise.
  const referencedTechniqueIds = new Set<string>();
  const referencedUserIds = new Set<string>();
  for (const incident of MOCK_INCIDENTS) {
    incident.mitreTechniqueIds.forEach((id) => referencedTechniqueIds.add(id));
    if (incident.assignedAnalystId) referencedUserIds.add(incident.assignedAnalystId);
  }
  for (const actor of MOCK_THREAT_ACTORS) {
    actor.techniqueIds.forEach((id) => referencedTechniqueIds.add(id));
  }

  for (const user of MOCK_USERS) {
    if (!referencedUserIds.has(user.id)) continue;
    addNode({ id: user.id, type: "user", label: user.name, subtitle: user.title ?? "Analyst" });
  }

  for (const technique of MOCK_TECHNIQUES) {
    if (!referencedTechniqueIds.has(technique.id)) continue;
    addNode({
      id: technique.id,
      type: "technique",
      label: technique.id,
      subtitle: technique.name,
    });
  }

  for (const actor of MOCK_THREAT_ACTORS) {
    addNode({
      id: actor.id,
      type: "threat_actor",
      label: actor.name,
      subtitle: actor.motivations.join(", "),
    });
  }

  const edges: GraphEdge[] = [];
  const seenPairs = new Set<string>();

  function addEdge(source: string, target: string, relation: GraphEdgeRelation) {
    if (!nodeIds.has(source) || !nodeIds.has(target) || source === target) return;
    const pairKey = [source, target].sort().join("|");
    if (seenPairs.has(pairKey)) return;
    seenPairs.add(pairKey);
    edges.push({ id: `edge_${pairKey}`, source, target, relation });
  }

  for (const indicator of MOCK_INDICATORS) {
    for (const incidentId of indicator.relatedIncidentIds) {
      addEdge(indicator.id, incidentId, "observed_in");
    }
    if (indicator.type === "ip") {
      indicator.relatedDomainIds.forEach((id) => addEdge(indicator.id, id, "correlates_with"));
    } else if (indicator.type === "domain") {
      indicator.relatedIpIds.forEach((id) => addEdge(indicator.id, id, "correlates_with"));
      indicator.relatedUrlIds.forEach((id) => addEdge(indicator.id, id, "correlates_with"));
    } else if (indicator.type === "url") {
      indicator.relatedIndicatorIds.forEach((id) => addEdge(indicator.id, id, "correlates_with"));
    }
  }

  for (const incident of MOCK_INCIDENTS) {
    if (incident.assignedAnalystId) {
      addEdge(incident.id, incident.assignedAnalystId, "assigned_to");
    }
    incident.mitreTechniqueIds.forEach((id) => addEdge(incident.id, id, "maps_to"));
  }

  for (const actor of MOCK_THREAT_ACTORS) {
    actor.techniqueIds.forEach((id) => addEdge(actor.id, id, "attributed_to"));
  }

  return { nodes, edges };
}

export class MockGraphService implements GraphService {
  async getGraph(): Promise<GraphData> {
    return delay(buildGraph(), 400);
  }
}
