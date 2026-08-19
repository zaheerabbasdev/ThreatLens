import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors/AppError.js";
import { verifyAccessToken, TokenError } from "../security/tokens.js";

const BEARER_PREFIX = "Bearer ";

/**
 * Authentication gate (spec §18: "Authentication answers 'Who are you?'").
 * Verifies the access token's signature/issuer/audience/expiry and attaches
 * the resulting identity to `req.user`. Route handlers and requirePermission
 * both rely on this having already run — it must be the first thing on any
 * protected route.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.header("Authorization");
  if (!header?.startsWith(BEARER_PREFIX)) {
    next(new UnauthorizedError("Authentication is required."));
    return;
  }

  const token = header.slice(BEARER_PREFIX.length);
  try {
    const claims = await verifyAccessToken(token);
    req.user = { id: claims.sub, organizationId: claims.org, role: claims.role };
    next();
  } catch (err) {
    if (err instanceof TokenError) {
      next(new UnauthorizedError("Your session has expired. Please sign in again."));
      return;
    }
    next(err);
  }
}
