import type { ConfidenceLevel } from "../types/common.js";
import type { IndicatorType } from "../types/indicator.js";

export type ThreatIntelVerdict = "malicious" | "suspicious" | "clean" | "unknown";

export interface ThreatIntelLookupInput {
  type: IndicatorType;
  value: string;
}

/**
 * What one provider says about one indicator. Deliberately does NOT include
 * a riskScore/severity — those are computed deterministically by
 * ioc.service.ts from one or more of these (spec §39/§40: "never present
 * external intelligence as absolute truth"). A provider only ever
 * contributes an opinion; the platform decides what that opinion means.
 */
export interface ThreatIntelLookupOutput {
  verdict: ThreatIntelVerdict;
  /** 0-100 "how bad", provider-specific; absent when verdict is "unknown". */
  score?: number;
  /** How much weight this provider's own opinion deserves — e.g. based on how many of its sub-engines/vendors reported at all. */
  confidence: ConfidenceLevel;
  categories: string[];
}

export interface ThreatIntelProvider {
  /** Short, stable identifier — persisted as DataSource.provider, so this is what an analyst sees attributed to a piece of intel (spec §40: display source/timestamp/confidence/provider). */
  readonly name: string;
  lookup(input: ThreatIntelLookupInput): Promise<{ output: ThreatIntelLookupOutput; durationMs: number }>;
}

/**
 * Wraps any provider-layer failure — network error, timeout, unexpected
 * response shape, non-2xx status. ioc.service.ts never lets one of these
 * escape to a controller as-is: a single provider being down degrades that
 * one provider's contribution, it never fails the whole enrichment or
 * exposes provider-internal details to the client (spec §34).
 */
export class ThreatIntelProviderError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown,
    /** True for transient failures (timeout, 5xx, network) worth a retry later; false for a fundamentally malformed response, which won't fix itself on retry. */
    readonly retryable = true,
  ) {
    super(message);
    this.name = "ThreatIntelProviderError";
  }
}

/** A specific, common ThreatIntelProviderError: the provider's own quota/rate limit was hit. Distinguished so callers can log/handle it distinctly from "the provider is broken" (spec §40: "handle quotas" explicitly). */
export class ThreatIntelQuotaError extends ThreatIntelProviderError {
  constructor(message = "The threat intelligence provider's request quota has been exhausted.") {
    super(message, undefined, true);
    this.name = "ThreatIntelQuotaError";
  }
}
