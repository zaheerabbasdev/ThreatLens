import express from "express";
import { pinoHttp } from "pino-http";
import { corsMiddleware, securityHeaders } from "./middleware/security.js";
import { requestId } from "./middleware/requestId.js";
import { apiRateLimit } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { apiV1Router } from "./routes/index.js";
import { logger } from "./utils/logger.js";

export function createApp() {
  const app = express();

  // Trust the first proxy hop (load balancer/reverse proxy) so req.ip and
  // rate limiting see the real client address instead of the proxy's.
  app.set("trust proxy", 1);

  // Request ID first — everything after this (logging, error responses)
  // depends on req.id already being set.
  app.use(requestId);

  app.use(securityHeaders);
  app.use(corsMiddleware);

  // Request body size limits (spec §22) — prevents attackers from sending
  // enormous payloads; individual routes may set a tighter limit.
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as express.Request).id,
      autoLogging: {
        ignore: (req) => req.url === "/api/v1/health",
      },
    }),
  );

  // Baseline moderate limit for all API traffic; stricter per-category
  // limiters (auth, password reset, ...) are applied on top of this at the
  // individual route level once those routes exist.
  app.use("/api/v1", apiRateLimit, apiV1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
