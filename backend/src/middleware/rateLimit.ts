import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import { sendError } from "../utils/apiResponse.js";

/**
 * Per-category rate limiters (spec §23: "Do not use one universal rate
 * limit for everything"). Each tier below maps to a category named in the
 * spec; auth/password-reset limiters get wired up once those routes exist
 * in the next backend increment.
 */
function handler(req: Request, res: Response) {
  sendError(res, 429, "TOO_MANY_REQUESTS", "Too many requests. Please try again later.", req.id);
}

const shared = {
  standardHeaders: true,
  legacyHeaders: false,
  handler,
};

/** Normal API requests — MODERATE. */
export const apiRateLimit = rateLimit({
  ...shared,
  windowMs: 60_000,
  limit: 120,
});

/** Public, unauthenticated endpoints — STRICTER. */
export const publicRateLimit = rateLimit({
  ...shared,
  windowMs: 60_000,
  limit: 30,
});

/** Login/registration — STRICT (brute-force protection, spec §24). */
export const authRateLimit = rateLimit({
  ...shared,
  windowMs: 15 * 60_000,
  limit: 10,
});

/** Password reset / email verification requests — VERY STRICT. */
export const sensitiveActionRateLimit = rateLimit({
  ...shared,
  windowMs: 60 * 60_000,
  limit: 5,
});
