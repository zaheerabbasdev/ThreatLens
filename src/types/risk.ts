import type { Severity } from "./common";

export interface RiskFactor {
  label: string;
  weight: number;
  contribution: number;
  description: string;
}

/**
 * Deterministic risk score. Computed by src/utils/risk.ts from concrete
 * factors — never delegated to the AI layer. AI may explain a score
 * (see AIAnalysis) but never assigns one directly.
 */
export interface RiskScore {
  value: number;
  severity: Severity;
  factors: RiskFactor[];
  calculatedAt: string;
}
