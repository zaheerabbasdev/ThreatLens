import { logger } from "../utils/logger.js";

/**
 * Usage/cost tracking (spec §60: requests, tokens, estimated cost,
 * provider, duration, failures) and the per-organization daily cap that
 * backs it (spec §59: "do not allow a user to generate unlimited AI
 * requests" — this is the spend-shaped guard; the route-level rate limiter
 * in middleware/rateLimit.ts is the request-frequency-shaped one; together
 * they cover both dimensions of abuse).
 *
 * In-memory for now, same tradeoff as every other in-memory piece in this
 * backend (Phase 5 gave the domain repositories a real database; this
 * tracker didn't get the same treatment yet — a restart resets the daily
 * counters, acceptable for the current scale, not for a real deployment).
 */
export interface AIUsageEvent {
  organizationId: string;
  userId: string;
  provider: string;
  operation: string;
  tokensUsed?: number;
  durationMs: number;
  succeeded: boolean;
  estimatedCostUsd?: number;
}

// Rough, deliberately conservative per-1K-token estimate for logging/cap
// purposes only — not a billing-accurate figure, and never presented to a
// client as one.
const ESTIMATED_COST_PER_1K_TOKENS_USD = 0.0006;

const DAY_MS = 24 * 60 * 60_000;

class AICostTracker {
  private readonly requestTimestampsByOrg = new Map<string, number[]>();

  record(event: AIUsageEvent): void {
    const estimatedCostUsd = event.tokensUsed
      ? Math.round((event.tokensUsed / 1000) * ESTIMATED_COST_PER_1K_TOKENS_USD * 1_000_000) / 1_000_000
      : undefined;

    logger.info(
      {
        event: "ai.usage",
        organizationId: event.organizationId,
        userId: event.userId,
        provider: event.provider,
        operation: event.operation,
        tokensUsed: event.tokensUsed,
        durationMs: event.durationMs,
        succeeded: event.succeeded,
        estimatedCostUsd,
      },
      event.succeeded ? "AI request completed" : "AI request failed",
    );

    const timestamps = this.requestTimestampsByOrg.get(event.organizationId) ?? [];
    timestamps.push(Date.now());
    this.requestTimestampsByOrg.set(event.organizationId, timestamps);
  }

  /** Requests from this organization in the trailing 24h — evicts anything older while counting, so the map doesn't grow unbounded. */
  requestsInLast24h(organizationId: string): number {
    const cutoff = Date.now() - DAY_MS;
    const timestamps = (this.requestTimestampsByOrg.get(organizationId) ?? []).filter((t) => t > cutoff);
    this.requestTimestampsByOrg.set(organizationId, timestamps);
    return timestamps.length;
  }
}

export const aiCostTracker = new AICostTracker();
