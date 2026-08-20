import type { EventFeatures } from "./featureExtraction.js";

export interface FeatureContribution {
  feature: string;
  zScore: number;
  direction: "higher_than_typical" | "lower_than_typical";
}

/**
 * What the ML service says about one entity's recent behavior. Deliberately
 * carries no "incident" or "alert" semantics of its own — anomalyDetection.
 * service.ts decides what an anomaly result means for the rest of the
 * platform (spec §39: AI/ML never owns a security decision, only informs
 * one).
 */
export interface AnomalyDetectionOutput {
  isAnomaly: boolean;
  /** 0-100, higher = more anomalous — the ML service's own deterministic scale, see ml-service/app/model.py. */
  anomalyScore: number;
  confidence: "low" | "medium" | "high";
  contributingFeatures: FeatureContribution[];
  modelVersion: string;
}

export interface AnomalyDetectionProvider {
  readonly name: string;
  detect(features: EventFeatures): Promise<{ output: AnomalyDetectionOutput; durationMs: number }>;
}

/** Same role as ThreatIntelProviderError/AIProviderError: wraps any provider-layer failure (network, timeout, bad response shape) so it never reaches a controller raw. */
export class AnomalyProviderError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown,
    readonly retryable = true,
  ) {
    super(message);
    this.name = "AnomalyProviderError";
  }
}
