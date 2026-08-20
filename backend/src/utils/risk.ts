import type { ConfidenceLevel, Severity } from "../types/common.js";

/**
 * Deterministic risk engine (spec §39): risk calculation must never be
 * delegated to an LLM or to a single external opinion — AI may explain a
 * score, it never sets one, and no external threat-intel provider gets to
 * either. Mirrors the frontend's identical src/utils/risk.ts thresholds so
 * a "high" indicator means the same thing in both layers.
 */
export function severityFromScore(value: number): Severity {
  if (value >= 85) return "critical";
  if (value >= 65) return "high";
  if (value >= 40) return "medium";
  if (value >= 15) return "low";
  return "info";
}

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  unverified: 0,
  low: 1,
  medium: 2,
  high: 3,
  confirmed: 4,
};

/** The strongest confidence among several — used when merging opinions from multiple sources (e.g. threat-intel providers) into one summary field. */
export function highestConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  return levels.reduce((best, level) => (CONFIDENCE_RANK[level] > CONFIDENCE_RANK[best] ? level : best), "unverified" as ConfidenceLevel);
}
