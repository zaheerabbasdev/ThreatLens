import type { IncidentRepository } from "../repositories/incident.repository.js";
import type { IndicatorRepository } from "../repositories/indicator.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { MitreRepository } from "../repositories/mitre.repository.js";
import type { ThreatActorRepository } from "../repositories/threatActor.repository.js";
import type { SecurityEventRepository } from "../repositories/securityEvent.repository.js";
import type { Indicator } from "../types/indicator.js";
import type { GraphData, GraphEdge, GraphEdgeRelation, GraphNode } from "../types/graph.js";
import type { CorrelationCandidate } from "./correlation.js";
import { findCorrelations } from "./correlation.js";
import { NotFoundError } from "../errors/AppError.js";

const ALL_ROWS = 10_000; // see mitre.service.ts's identical comment on the same in-memory-phase tradeoff

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function truncateMiddle(value: string, keep = 6): string {
  if (value.length <= keep * 2 + 3) return value;
  return `${value.slice(0, keep)}…${value.slice(-keep)}`;
}

function formatShortId(id: string): string {
  const [prefix, ...rest] = id.split("_");
  if (rest.length === 0) return id.toUpperCase();
  return `${prefix?.toUpperCase()}-${rest.join("_")}`;
}

/**
 * Assembles the correlation graph the same way the frontend mock does
 * (indicators → incidents → users → techniques → threat actors, all
 * derived from concrete fields already on those entities — spec §41:
 * nothing here is fabricated or AI-suggested).
 *
 * The one thing that has to change from the mock: incidents/indicators/
 * users are organization-scoped, so this only ever assembles from the
 * caller's own org data — MITRE techniques and threat actors are global
 * reference data (spec §41/§44) and are included for every org equally,
 * same as the mock includes them unconditionally.
 */
export class GraphService {
  constructor(
    private readonly incidents: IncidentRepository,
    private readonly indicators: IndicatorRepository,
    private readonly users: UserRepository,
    private readonly mitre: MitreRepository,
    private readonly threatActors: ThreatActorRepository,
    private readonly securityEvents: SecurityEventRepository,
  ) {}

  async getGraph(organizationId: string): Promise<GraphData> {
    const [{ items: orgIndicators }, { items: orgIncidents }, { items: orgUsers }, allTechniques, allActors] =
      await Promise.all([
        this.indicators.list(organizationId, { pageSize: ALL_ROWS }),
        this.incidents.list(organizationId, { pageSize: ALL_ROWS }),
        this.users.list(organizationId, { pageSize: ALL_ROWS }),
        this.mitre.listTechniques({}),
        this.threatActors.listAll(),
      ]);

    const nodes: GraphNode[] = [];
    const nodeIds = new Set<string>();
    function addNode(node: GraphNode) {
      if (nodeIds.has(node.id)) return;
      nodeIds.add(node.id);
      nodes.push(node);
    }

    for (const indicator of orgIndicators) {
      addNode({
        id: indicator.id,
        type: indicator.type,
        label: truncateMiddle(indicator.value, 16),
        subtitle: indicator.type.toUpperCase(),
        severity: indicator.severity,
        href: `/app/threat-intel/${indicator.id}`,
      });
    }

    for (const incident of orgIncidents) {
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
    // something within this org — an unreferenced node is visual noise.
    const referencedTechniqueIds = new Set<string>();
    const referencedUserIds = new Set<string>();
    for (const incident of orgIncidents) {
      incident.mitreTechniqueIds.forEach((id) => referencedTechniqueIds.add(id));
      if (incident.assignedAnalystId) referencedUserIds.add(incident.assignedAnalystId);
    }
    // Threat actors are global — every one of their techniques is shown
    // regardless of this org's own activity, same as the mock.
    for (const actor of allActors) {
      actor.techniqueIds.forEach((id) => referencedTechniqueIds.add(id));
    }

    for (const user of orgUsers) {
      if (!referencedUserIds.has(user.id)) continue;
      addNode({ id: user.id, type: "user", label: user.name, subtitle: user.title ?? "Analyst" });
    }

    for (const technique of allTechniques) {
      if (!referencedTechniqueIds.has(technique.id)) continue;
      addNode({ id: technique.id, type: "technique", label: technique.id, subtitle: technique.name });
    }

    for (const actor of allActors) {
      addNode({ id: actor.id, type: "threat_actor", label: actor.name, subtitle: actor.motivations.join(", ") });
    }

    const edges: GraphEdge[] = [];
    const seenPairs = new Set<string>();
    function addEdge(source: string, target: string, relation: GraphEdgeRelation) {
      // Both ends must already be a node in THIS org's graph — since node
      // sets above were only ever populated from org-scoped data (or
      // global reference data available to every org alike), this is what
      // actually prevents a cross-tenant edge, not a separate check.
      if (!nodeIds.has(source) || !nodeIds.has(target) || source === target) return;
      const pairKey = [source, target].sort().join("|");
      if (seenPairs.has(pairKey)) return;
      seenPairs.add(pairKey);
      edges.push({ id: `edge_${pairKey}`, source, target, relation });
    }

    for (const indicator of orgIndicators) {
      for (const incidentId of indicator.relatedIncidentIds) {
        addEdge(indicator.id, incidentId, "observed_in");
      }
      // Per-type correlation fields — Indicator is a discriminated union,
      // narrowed inside this helper before reading the type-specific ones.
      addIndicatorCorrelations(indicator, addEdge);
    }

    for (const incident of orgIncidents) {
      if (incident.assignedAnalystId) addEdge(incident.id, incident.assignedAnalystId, "assigned_to");
      incident.mitreTechniqueIds.forEach((id) => addEdge(incident.id, id, "maps_to"));
    }

    for (const actor of allActors) {
      actor.techniqueIds.forEach((id) => addEdge(actor.id, id, "attributed_to"));
    }

    return { nodes, edges };
  }

  /**
   * Deterministic correlation discovery (spec §41) — surfaces indicators/
   * security events that share concrete evidence with `indicatorId` but
   * AREN'T already an explicit edge in `getGraph()`. Never persisted, never
   * auto-linked: see correlation.ts's header comment on why these stay
   * "candidates" until an analyst confirms one for real.
   */
  async findCorrelationsFor(organizationId: string, indicatorId: string): Promise<CorrelationCandidate[]> {
    const subject = await this.indicators.getById(organizationId, indicatorId);
    if (!subject) throw new NotFoundError("The requested indicator was not found.");

    const [{ items: otherIndicators }, { items: events }] = await Promise.all([
      this.indicators.list(organizationId, { pageSize: ALL_ROWS }),
      this.securityEvents.list(organizationId, 1, ALL_ROWS),
    ]);

    return findCorrelations(subject, otherIndicators, events);
  }
}

function addIndicatorCorrelations(
  indicator: Indicator,
  addEdge: (source: string, target: string, relation: GraphEdgeRelation) => void,
): void {
  switch (indicator.type) {
    case "ip":
      indicator.relatedDomainIds.forEach((id) => addEdge(indicator.id, id, "correlates_with"));
      break;
    case "domain":
      indicator.relatedIpIds.forEach((id) => addEdge(indicator.id, id, "correlates_with"));
      indicator.relatedUrlIds.forEach((id) => addEdge(indicator.id, id, "correlates_with"));
      break;
    case "url":
      indicator.relatedIndicatorIds.forEach((id) => addEdge(indicator.id, id, "correlates_with"));
      break;
    case "hash":
      break;
  }
}
