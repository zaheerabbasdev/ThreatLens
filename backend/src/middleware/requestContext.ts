import { AsyncLocalStorage } from "node:async_hooks";
import type { NextFunction, Request, Response } from "express";

export interface RequestContext {
  requestId: string;
  ip: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/**
 * Makes the current request's ID and client IP available anywhere in that
 * request's async call chain — without threading them as parameters through
 * every service method that might eventually need to record an audit entry
 * (spec §38 wants both on every record). Must run after `requestId`
 * middleware, since it reads `req.id`.
 */
export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  storage.run({ requestId: req.id, ip: req.ip ?? "unknown" }, next);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}
