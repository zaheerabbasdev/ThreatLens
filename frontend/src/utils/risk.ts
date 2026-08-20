import type { RiskFactor, RiskScore, Severity } from "@/types";

/**
 * Deterministic risk engine. Per spec §39: risk calculation must never be
 * delegated to an LLM. AI may explain a score, it never sets one. This is a
 * simple, explainable weighted-sum model — deliberately not a black box.
 */
export function severityFromScore(value: number): Severity {
  if (value >= 85) return "critical";
  if (value >= 65) return "high";
  if (value >= 40) return "medium";
  if (value >= 15) return "low";
  return "info";
}

export function calculateRiskScore(factors: RiskFactor[], calculatedAt: string): RiskScore {
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0) || 1;
  const weightedSum = factors.reduce((sum, f) => sum + f.weight * f.contribution, 0);
  const value = Math.round(Math.min(100, Math.max(0, weightedSum / totalWeight)));

  return {
    value,
    severity: severityFromScore(value),
    factors,
    calculatedAt,
  };
}
