import type { SecurityEvent } from "../types/securityEvent.js";

/**
 * Same tenant-isolation contract as every other repository (spec §19/§20):
 * every method takes `organizationId` first. `listForUser` is the one this
 * module actually depends on — it's the raw material for feature extraction
 * (anomalyDetection/featureExtraction.ts computes a fixed-size feature
 * vector from whatever this returns).
 */
export interface SecurityEventRepository {
  create(event: SecurityEvent): Promise<SecurityEvent>;
  list(organizationId: string, page: number, pageSize: number): Promise<{ items: SecurityEvent[]; total: number }>;
  /** All events for one user, oldest first — featureExtraction.ts splits this into "baseline" (before the window) and "window" itself. */
  listForUser(organizationId: string, userId: string): Promise<SecurityEvent[]>;
}

export class InMemorySecurityEventRepository implements SecurityEventRepository {
  private readonly eventsById = new Map<string, SecurityEvent>();

  async create(event: SecurityEvent): Promise<SecurityEvent> {
    this.eventsById.set(event.id, event);
    return { ...event };
  }

  async list(organizationId: string, page: number, pageSize: number): Promise<{ items: SecurityEvent[]; total: number }> {
    const items = [...this.eventsById.values()]
      .filter((e) => e.organizationId === organizationId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize).map((e) => ({ ...e })), total: items.length };
  }

  async listForUser(organizationId: string, userId: string): Promise<SecurityEvent[]> {
    return [...this.eventsById.values()]
      .filter((e) => e.organizationId === organizationId && e.userId === userId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((e) => ({ ...e }));
  }

  /** Test/seed helper only — never exposed through the interface real callers depend on. */
  seed(event: SecurityEvent): void {
    this.eventsById.set(event.id, event);
  }
}
