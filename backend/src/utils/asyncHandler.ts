import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express 4 does not catch a rejected promise from an async route handler —
 * an unawaited rejection would hang the request instead of reaching
 * errorHandler. Wrap every async handler with this rather than repeating
 * try/catch(next) in each one.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
