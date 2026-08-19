import type { Response } from "express";

/**
 * Consistent success/error response shapes across every route (spec §35).
 * `meta` carries pagination and similar envelope info — never anything
 * sensitive, since it's returned verbatim to the client.
 */
export function sendSuccess<T>(res: Response, data: T, meta?: Record<string, unknown>, statusCode = 200): void {
  res.status(statusCode).json(meta ? { data, meta } : { data });
}

export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  requestId: string,
  details?: unknown,
): void {
  const body: ErrorResponseBody = { error: { code, message, requestId } };
  if (details !== undefined) body.error.details = details;
  res.status(statusCode).json(body);
}
