import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    /** Correlation ID for this request — set by requestId middleware, reused by the logger and every error response (spec §36). */
    id: string;
  }
}
