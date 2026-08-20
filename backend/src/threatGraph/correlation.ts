import type { ConfidenceLevel } from "../types/common.js";
import type { Indicator } from "../types/indicator.js";
import type { SecurityEvent } from "../types/securityEvent.js";

export type CorrelationEvidenceType =
  | "shared_source_ip"
  | "shared_asn"
  | "shared_malware_family"
  | "shared_domain"
  | "shared_tag";

export type CorrelationRelatedType = "indicator" | "security_event";

/**
 * One deterministic, evidence-backed suggestion — never persisted as a real
 * graph edge on its own (spec §41: "AI may suggest possible relationships,
 * but deterministic evidence should be clearly separated" — this is that
 * separation: a candidate is explicitly not the same thing as a confirmed
 * link in `sources[]`/`relatedIncidentIds`/etc., and nothing here is
 * AI-derived at all). An analyst reviews these and, if they agree, links
 * the two records for real through the existing investigation endpoints
 * (`POST /investigations/:id/indicators`, etc.) — the same human-in-the-loop
 * shape as Phase 6's recommendations.
 */
export interface CorrelationCandidate {
  relatedType: CorrelationRelatedType;
  relatedId: string;
  relatedLabel: string;
  evidenceType: CorrelationEvidenceType;
  confidence: ConfidenceLevel;
  description: string;
}

/** How much weight each evidence type deserves — fixed, documented, never learned or AI-adjusted. */
const CONFIDENCE_BY_EVIDENCE: Record<CorrelationEvidenceType, ConfidenceLevel> = {
  shared_source_ip: "high", // directly observed against this org's own systems
  shared_malware_family: "high", // an exact, named classification match
  shared_domain: "high", // an exact domain string match
  shared_asn: "medium", // same hosting infrastructure, weaker than a direct observation
  shared_tag: "low", // analyst-applied labels can be coincidental
};

function candidate(
  relatedType: CorrelationRelatedType,
  relatedId: string,
  relatedLabel: string,
  evidenceType: CorrelationEvidenceType,
  description: string,
): CorrelationCandidate {
  return { relatedType, relatedId, relatedLabel, evidenceType, confidence: CONFIDENCE_BY_EVIDENCE[evidenceType], description };
}

/**
 * Finds OTHER indicators/security events that share concrete evidence with
 * `subject` — never a fabricated or inferred relationship, only fields that
 * are already literally equal (spec §41: "generate relationships based on
 * evidence... do not fabricate relationships using AI"). Both `otherIndicators`
 * and `events` are expected to already be scoped to the caller's own
 * organization (same tenant-isolation contract as every repository in this
 * codebase) — this function doesn't re-check that itself.
 */
export function findCorrelations(
  subject: Indicator,
  otherIndicators: Indicator[],
  events: SecurityEvent[],
): CorrelationCandidate[] {
  const candidates: CorrelationCandidate[] = [];

  if (subject.type === "ip") {
    for (const event of events) {
      if (event.sourceIp && event.sourceIp === subject.value) {
        candidates.push(
          candidate(
            "security_event",
            event.id,
            event.description,
            "shared_source_ip",
            `A security event was observed from ${subject.value}, which matches this indicator's value.`,
          ),
        );
      }
    }
  }

  for (const other of otherIndicators) {
    if (other.id === subject.id) continue;

    if (subject.type === "ip" && other.type === "ip" && subject.asn && subject.asn === other.asn) {
      candidates.push(
        candidate("indicator", other.id, other.value, "shared_asn", `Both indicators are hosted on ${subject.asn}.`),
      );
    }

    if (subject.type === "hash" && other.type === "hash" && subject.malwareFamily && subject.malwareFamily === other.malwareFamily) {
      candidates.push(
        candidate(
          "indicator",
          other.id,
          other.value,
          "shared_malware_family",
          `Both files are classified as ${subject.malwareFamily}.`,
        ),
      );
    }

    if (subject.type === "domain" && other.type === "url" && other.domain === subject.value) {
      candidates.push(
        candidate("indicator", other.id, other.value, "shared_domain", `This URL resolves under the domain ${subject.value}.`),
      );
    } else if (subject.type === "url" && other.type === "domain" && subject.domain === other.value) {
      candidates.push(
        candidate("indicator", other.id, other.value, "shared_domain", `This URL resolves under the domain ${other.value}.`),
      );
    }

    const sharedTag = subject.tags.find((tag) => other.tags.includes(tag));
    if (sharedTag) {
      candidates.push(
        candidate("indicator", other.id, other.value, "shared_tag", `Both indicators are tagged "${sharedTag}".`),
      );
    }
  }

  return candidates;
}
