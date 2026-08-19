import cors from "cors";
import helmet from "helmet";
import type { CorsOptions } from "cors";
import { env } from "../config/env.js";

/** Helmet with defaults — revisit CSP directives once real frontend origins/CDNs are known (spec §25). */
export const securityHeaders = helmet();

/**
 * Explicit origin allowlist from configuration — never a wildcard for an
 * authenticated API (spec §26). An unlisted origin gets no CORS headers at
 * all rather than an error response, which is the standard, safe behavior
 * for cross-origin requests.
 */
const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // No Origin header (server-to-server, curl, same-origin) — allow.
    if (!origin || env.CORS_ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
};

export const corsMiddleware = cors(corsOptions);
