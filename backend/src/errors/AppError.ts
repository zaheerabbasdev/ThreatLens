/**
 * Base class for errors that are safe to describe to a client. Anything
 * NOT thrown as an AppError is treated by the error middleware as an
 * unexpected internal failure — logged in full, but reported externally as
 * a generic message (spec §34: never expose stack traces, DB errors,
 * internal paths, or infrastructure details).
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  /** Safe to include in the API error response body (spec §35). */
  readonly isOperational = true;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "The request could not be understood.", code = "BAD_REQUEST") {
    super(400, code, message);
  }
}

export class ValidationError extends AppError {
  readonly details?: unknown;
  constructor(message = "The request failed validation.", details?: unknown) {
    super(422, "VALIDATION_ERROR", message);
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication is required.") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to perform this action.") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "The request conflicts with the current state.") {
    super(409, "CONFLICT", message);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(429, "TOO_MANY_REQUESTS", message);
  }
}

/** A dependency this request needs isn't available right now — an unconfigured or failing AI provider, for example. Distinct from a 500: the server itself is fine, one specific capability isn't. */
export class ServiceUnavailableError extends AppError {
  constructor(message = "This feature is temporarily unavailable.") {
    super(503, "SERVICE_UNAVAILABLE", message);
  }
}
