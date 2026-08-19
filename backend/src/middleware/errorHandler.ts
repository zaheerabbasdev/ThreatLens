import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, ValidationError } from "../errors/AppError.js";
import { sendError } from "../utils/apiResponse.js";
import { logger } from "../utils/logger.js";

/**
 * Centralized error handling (spec §34). Internally, log everything useful
 * for debugging; externally, return only a safe, structured error — never a
 * stack trace, DB error, internal path, or dependency detail.
 */
// The unused fourth parameter is required: Express only recognizes error
// middleware by its 4-arg arity.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    const validation = new ValidationError("The request failed validation.", err.flatten());
    logger.warn({ requestId: req.id, err: validation }, "Request validation failed");
    sendError(res, validation.statusCode, validation.code, validation.message, req.id, validation.details);
    return;
  }

  if (err instanceof AppError) {
    const level = err.statusCode >= 500 ? "error" : "warn";
    logger[level]({ requestId: req.id, err }, err.message);
    sendError(res, err.statusCode, err.code, err.message, req.id);
    return;
  }

  // body-parser (and other middleware ahead of any route handler) throws
  // plain http-errors-style objects rather than AppError — a malformed or
  // oversized request body is a client mistake, not a server failure, and
  // must not fall through to a 500.
  const clientStatus = getHttpErrorStatus(err);
  if (clientStatus) {
    logger.warn({ requestId: req.id, err }, "Malformed request rejected before reaching a route handler");
    sendError(res, clientStatus, "BAD_REQUEST", "The request could not be processed.", req.id);
    return;
  }

  // Unexpected failure: log the full error, expose nothing about it.
  logger.error({ requestId: req.id, err }, "Unhandled error");
  sendError(res, 500, "INTERNAL_ERROR", "Something went wrong. Please try again.", req.id);
}

/** Extracts a 4xx status from an http-errors-style error object (status/statusCode), if present. */
function getHttpErrorStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const status = "statusCode" in err ? err.statusCode : "status" in err ? err.status : undefined;
  return typeof status === "number" && status >= 400 && status < 500 ? status : undefined;
}
