import type { GraphData } from "@/types";

/**
 * Assembles the correlation graph (indicators → incidents → users →
 * techniques → threat actors) from evidence already present on those
 * entities. Backed today by MockGraphService; a future implementation would
 * run this server-side as data volume grows. Relationships are all derived
 * from concrete fields (e.g. an indicator's relatedIncidentIds) — nothing
 * here is fabricated (spec §41: AI may suggest relationships, but
 * deterministic evidence must stay separate).
 */
export interface GraphService {
  getGraph(): Promise<GraphData>;
}
