import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";
import { sendError } from "../utils/apiResponse.js";

/**
 * Per-category rate limiters (spec §23: "Do not use one universal rate
 * limit for everything").
 *
 * These are factories, not shared singleton instances — each middleware
 * keeps its own request-count state internally, so a module-level export
 * would mean every `createApp()` call (every test, every app instance)
 * silently shares one global counter. That both breaks test isolation (an
 * earlier test's requests count against a later, unrelated test) and isn't
 * what you'd want in-process anyway if multiple apps were ever composed
 * together. `createApp()` calls each factory fresh.
 */
function handler(req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]) {
  sendError(res, 429, "TOO_MANY_REQUESTS", "Too many requests. Please try again later.", req.id);
}

const shared = {
  standardHeaders: true,
  legacyHeaders: false,
  handler,
};

/** Normal API requests — MODERATE. */
export function createApiRateLimit(): RequestHandler {
  return rateLimit({ ...shared, windowMs: 60_000, limit: 120 });
}

/** Login/registration/refresh — STRICT (brute-force protection, spec §24). */
export function createAuthRateLimit(): RequestHandler {
  return rateLimit({ ...shared, windowMs: 15 * 60_000, limit: 10 });
}

/** Password reset / email verification / password change — VERY STRICT. */
export function createSensitiveActionRateLimit(): RequestHandler {
  return rateLimit({ ...shared, windowMs: 60 * 60_000, limit: 5 });
}

/** AI requests — STRICT (spec §23/§59: expensive, abusable, never unlimited). This limits request *frequency*; aiCostTracker's daily-per-org cap limits *spend* independently — see its header comment for why both are needed. */
export function createAIRateLimit(): RequestHandler {
  return rateLimit({ ...shared, windowMs: 60_000, limit: 15 });
}

/** IOC enrichment — STRICT, same reasoning as AI: each call burns real quota against an external provider (spec §40). */
export function createEnrichRateLimit(): RequestHandler {
  return rateLimit({ ...shared, windowMs: 60_000, limit: 15 });
}

/** Anomaly detection analysis — STRICT, same reasoning as AI/enrichment: each call is a real request to the ML service, not free (spec §23/§42). */
export function createAnomalyRateLimit(): RequestHandler {
  return rateLimit({ ...shared, windowMs: 60_000, limit: 15 });
}
