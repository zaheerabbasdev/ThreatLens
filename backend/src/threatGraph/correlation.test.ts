import { describe, expect, it } from "vitest";
import { findCorrelations } from "./correlation.js";
import type { IPIndicator, DomainIndicator, URLIndicator, HashIndicator } from "../types/indicator.js";
import type { SecurityEvent } from "../types/securityEvent.js";

const ORG = "org_1";

function ipIndicator(overrides: Partial<IPIndicator> = {}): IPIndicator {
  return {
    id: "ind_ip",
    organizationId: ORG,
    type: "ip",
    value: "1.2.3.4",
    riskScore: 50,
    severity: "medium",
    confidence: "medium",
    firstSeen: "2026-01-01T00:00:00Z",
    lastSeen: "2026-01-01T00:00:00Z",
    tags: [],
    relatedIncidentIds: [],
    sources: [],
    relatedDomainIds: [],
    ...overrides,
  };
}

function domainIndicator(overrides: Partial<DomainIndicator> = {}): DomainIndicator {
  return {
    id: "ind_domain",
    organizationId: ORG,
    type: "domain",
    value: "evil.test",
    riskScore: 50,
    severity: "medium",
    confidence: "medium",
    firstSeen: "2026-01-01T00:00:00Z",
    lastSeen: "2026-01-01T00:00:00Z",
    tags: [],
    relatedIncidentIds: [],
    sources: [],
    relatedIpIds: [],
    relatedUrlIds: [],
    ...overrides,
  };
}

function urlIndicator(overrides: Partial<URLIndicator> = {}): URLIndicator {
  return {
    id: "ind_url",
    organizationId: ORG,
    type: "url",
    value: "https://evil.test/login",
    riskScore: 50,
    severity: "medium",
    confidence: "medium",
    firstSeen: "2026-01-01T00:00:00Z",
    lastSeen: "2026-01-01T00:00:00Z",
    tags: [],
    relatedIncidentIds: [],
    sources: [],
    domain: "evil.test",
    path: "/login",
    isMalwareHost: false,
    relatedIndicatorIds: [],
    ...overrides,
  };
}

function hashIndicator(overrides: Partial<HashIndicator> = {}): HashIndicator {
  return {
    id: "ind_hash",
    organizationId: ORG,
    type: "hash",
    value: "a".repeat(64),
    riskScore: 50,
    severity: "medium",
    confidence: "medium",
    firstSeen: "2026-01-01T00:00:00Z",
    lastSeen: "2026-01-01T00:00:00Z",
    tags: [],
    relatedIncidentIds: [],
    sources: [],
    algorithm: "sha256",
    ...overrides,
  };
}

function securityEvent(overrides: Partial<SecurityEvent> = {}): SecurityEvent {
  return {
    id: "evt_1",
    organizationId: ORG,
    type: "authentication",
    description: "test event",
    severity: "info",
    timestamp: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("findCorrelations", () => {
  it("finds a security event whose sourceIp matches an IP indicator's value", () => {
    const subject = ipIndicator({ value: "9.9.9.9" });
    const event = securityEvent({ id: "evt_x", sourceIp: "9.9.9.9" });
    const candidates = findCorrelations(subject, [], [event]);
    expect(candidates).toContainEqual(
      expect.objectContaining({ relatedType: "security_event", relatedId: "evt_x", evidenceType: "shared_source_ip", confidence: "high" }),
    );
  });

  it("does not match a security event with a different sourceIp", () => {
    const subject = ipIndicator({ value: "9.9.9.9" });
    const event = securityEvent({ sourceIp: "1.1.1.1" });
    expect(findCorrelations(subject, [], [event])).toEqual([]);
  });

  it("finds two IP indicators sharing the same ASN", () => {
    const subject = ipIndicator({ id: "ind_a", asn: "AS1234" });
    const other = ipIndicator({ id: "ind_b", value: "5.6.7.8", asn: "AS1234" });
    const candidates = findCorrelations(subject, [other], []);
    expect(candidates).toContainEqual(expect.objectContaining({ relatedId: "ind_b", evidenceType: "shared_asn", confidence: "medium" }));
  });

  it("does not match IP indicators with no ASN set", () => {
    const subject = ipIndicator({ id: "ind_a" });
    const other = ipIndicator({ id: "ind_b", value: "5.6.7.8" });
    expect(findCorrelations(subject, [other], [])).toEqual([]);
  });

  it("finds two hash indicators sharing the same malware family", () => {
    const subject = hashIndicator({ id: "ind_a", malwareFamily: "Emotet" });
    const other = hashIndicator({ id: "ind_b", value: "b".repeat(64), malwareFamily: "Emotet" });
    const candidates = findCorrelations(subject, [other], []);
    expect(candidates).toContainEqual(
      expect.objectContaining({ relatedId: "ind_b", evidenceType: "shared_malware_family", confidence: "high" }),
    );
  });

  it("finds a domain indicator matching a URL indicator's domain field", () => {
    const subject = domainIndicator({ id: "ind_d", value: "evil.test" });
    const other = urlIndicator({ id: "ind_u", domain: "evil.test" });
    const candidates = findCorrelations(subject, [other], []);
    expect(candidates).toContainEqual(expect.objectContaining({ relatedId: "ind_u", evidenceType: "shared_domain", confidence: "high" }));
  });

  it("finds the reverse: a URL indicator matching a domain indicator's value", () => {
    const subject = urlIndicator({ id: "ind_u", domain: "evil.test" });
    const other = domainIndicator({ id: "ind_d", value: "evil.test" });
    const candidates = findCorrelations(subject, [other], []);
    expect(candidates).toContainEqual(expect.objectContaining({ relatedId: "ind_d", evidenceType: "shared_domain", confidence: "high" }));
  });

  it("finds indicators sharing at least one tag", () => {
    const subject = ipIndicator({ id: "ind_a", tags: ["c2-suspected", "tor-exit-node"] });
    const other = domainIndicator({ id: "ind_b", tags: ["phishing", "c2-suspected"] });
    const candidates = findCorrelations(subject, [other], []);
    expect(candidates).toContainEqual(expect.objectContaining({ relatedId: "ind_b", evidenceType: "shared_tag", confidence: "low" }));
  });

  it("never includes the subject indicator itself", () => {
    const subject = ipIndicator({ id: "ind_a", tags: ["x"] });
    const candidates = findCorrelations(subject, [subject], []);
    expect(candidates.find((c) => c.relatedId === "ind_a")).toBeUndefined();
  });

  it("returns an empty array when nothing shares any evidence", () => {
    const subject = ipIndicator({ id: "ind_a" });
    const other = hashIndicator({ id: "ind_b" });
    expect(findCorrelations(subject, [other], [])).toEqual([]);
  });

  it("can surface multiple distinct pieces of evidence for the same related indicator", () => {
    const subject = ipIndicator({ id: "ind_a", asn: "AS999", tags: ["botnet"] });
    const other = ipIndicator({ id: "ind_b", value: "8.8.4.4", asn: "AS999", tags: ["botnet"] });
    const candidates = findCorrelations(subject, [other], []);
    const evidenceTypes = candidates.filter((c) => c.relatedId === "ind_b").map((c) => c.evidenceType);
    expect(evidenceTypes).toEqual(expect.arrayContaining(["shared_asn", "shared_tag"]));
  });
});
