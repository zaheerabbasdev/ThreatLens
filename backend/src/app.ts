import express from "express";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { corsMiddleware, securityHeaders } from "./middleware/security.js";
import { requestId } from "./middleware/requestId.js";
import { createApiRateLimit } from "./middleware/rateLimit.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { createApiV1Router } from "./routes/index.js";
import { createAuthRouter } from "./auth/auth.routes.js";
import { createAuthController } from "./auth/auth.controller.js";
import { AuthService } from "./auth/auth.service.js";
import { InMemoryUserRepository } from "./repositories/user.repository.js";
import type { UserRepository } from "./repositories/user.repository.js";
import { InMemoryIncidentRepository } from "./repositories/incident.repository.js";
import type { IncidentRepository } from "./repositories/incident.repository.js";
import { createIncidentsRouter } from "./incidents/incidents.routes.js";
import { createIncidentsController } from "./incidents/incidents.controller.js";
import { IncidentsService } from "./incidents/incidents.service.js";
import { logger } from "./utils/logger.js";

export interface AppDependencies {
  userRepository: UserRepository;
  incidentRepository: IncidentRepository;
}

/**
 * Defaults to fresh, unseeded in-memory repositories — fine for the health
 * check and for tests that construct/seed their own instances explicitly.
 * server.ts passes real (seeded) ones in for actual runs.
 */
export function createApp(deps: Partial<AppDependencies> = {}) {
  const userRepository = deps.userRepository ?? new InMemoryUserRepository();
  const incidentRepository = deps.incidentRepository ?? new InMemoryIncidentRepository();

  const authService = new AuthService(userRepository);
  const authController = createAuthController(authService);
  const authRouter = createAuthRouter(authController);

  const incidentsService = new IncidentsService(incidentRepository, userRepository);
  const incidentsController = createIncidentsController(incidentsService);
  const incidentsRouter = createIncidentsRouter(incidentsController);

  const apiV1Router = createApiV1Router({ authRouter, incidentsRouter });

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
  app.use(cookieParser());

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
  // individual route level.
  app.use("/api/v1", createApiRateLimit(), apiV1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
