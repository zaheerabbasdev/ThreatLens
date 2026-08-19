import "express-serve-static-core";
import type { Role } from "./user.js";

declare module "express-serve-static-core" {
  interface Request {
    /** Correlation ID for this request — set by requestId middleware, reused by the logger and every error response (spec §36). */
    id: string;
    /** Set by requireAuth from a verified access token — never trust anything else as "who is calling". */
    user?: {
      id: string;
      organizationId: string;
      role: Role;
    };
  }
}
