import type { IOCListParams, IOCService, IOCSubmissionInput } from "@/services/ioc.service";
import type { Indicator, PaginatedResult } from "@/types";
import { MOCK_INDICATORS } from "@/mocks/indicators";
import { generateId } from "@/utils/id";
import { delay, paginate } from "./util";

const submitted: Indicator[] = [];

export class MockIOCService implements IOCService {
  async submit(input: IOCSubmissionInput): Promise<Indicator> {
    await delay(undefined, 500);
    const now = new Date().toISOString();
    const base = {
      id: generateId("ind"),
      value: input.value,
      riskScore: 0,
      severity: "info" as const,
      confidence: "unverified" as const,
      firstSeen: now,
      lastSeen: now,
      tags: [],
      relatedIncidentIds: [],
      sources: [],
      notes: input.notes,
    };
    let indicator: Indicator;
    switch (input.type) {
      case "ip":
        indicator = { ...base, type: "ip", relatedDomainIds: [] };
        break;
      case "domain":
        indicator = { ...base, type: "domain", relatedIpIds: [], relatedUrlIds: [] };
        break;
      case "url":
        indicator = {
          ...base,
          type: "url",
          domain: new URL(input.value.startsWith("http") ? input.value : `https://${input.value}`).hostname,
          path: "/",
          isMalwareHost: false,
          relatedIndicatorIds: [],
        };
        break;
      case "hash":
        indicator = { ...base, type: "hash", algorithm: input.value.length === 64 ? "sha256" : "md5" };
        break;
    }
    submitted.unshift(indicator);
    return indicator;
  }

  async list(params?: IOCListParams): Promise<PaginatedResult<Indicator>> {
    let items = [...submitted, ...MOCK_INDICATORS];
    if (params?.type) items = items.filter((i) => i.type === params.type);
    if (params?.severity) items = items.filter((i) => i.severity === params.severity);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((i) => i.value.toLowerCase().includes(q));
    }
    // Cloned, not the live singleton references — see the note in
    // incident.service.mock.ts's list() for why this matters after a write.
    return delay(paginate(items.map((i) => ({ ...i })), params), 350);
  }

  async getById(id: string): Promise<Indicator | null> {
    await delay(undefined, 250);
    const indicator = [...submitted, ...MOCK_INDICATORS].find((i) => i.id === id);
    return indicator ? { ...indicator } : null;
  }
}
