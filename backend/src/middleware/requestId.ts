import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const HEADER = "X-Request-Id";

/**
 * Assigns a correlation ID to every request, used consistently across logs,
 * error responses, and tracing (spec §36). A caller-supplied X-Request-Id is
 * intentionally NOT trusted as-is — only reused if it looks like a UUID —
 * so a client can't inject arbitrary content into logs/responses via this
 * header.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const supplied = req.header(HEADER);
  const isValidUuid = supplied ? /^[0-9a-f-]{36}$/i.test(supplied) : false;
  req.id = isValidUuid && supplied ? supplied : randomUUID();
  res.setHeader(HEADER, req.id);
  next();
}
