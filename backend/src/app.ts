import express from "express";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { corsMiddleware, securityHeaders } from "./middleware/security.js";
import { requestId } from "./middleware/requestId.js";
import { requestContextMiddleware } from "./middleware/requestContext.js";
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
import { InMemoryAlertRepository } from "./repositories/alert.repository.js";
import type { AlertRepository } from "./repositories/alert.repository.js";
import { createAlertsRouter } from "./alerts/alerts.routes.js";
import { createAlertsController } from "./alerts/alerts.controller.js";
import { AlertsService } from "./alerts/alerts.service.js";
import { InMemoryInvestigationRepository } from "./repositories/investigation.repository.js";
import type { InvestigationRepository } from "./repositories/investigation.repository.js";
import { createInvestigationsRouter } from "./investigations/investigations.routes.js";
import { createInvestigationsController } from "./investigations/investigations.controller.js";
import { InvestigationsService } from "./investigations/investigations.service.js";
import { InMemoryOrganizationRepository } from "./repositories/organization.repository.js";
import type { OrganizationRepository } from "./repositories/organization.repository.js";
import { createUsersRouter } from "./users/users.routes.js";
import { createUsersController } from "./users/users.controller.js";
import { UsersService } from "./users/users.service.js";
import { createOrganizationRouter } from "./organization/organization.routes.js";
import { createOrganizationController } from "./organization/organization.controller.js";
import { OrganizationService } from "./organization/organization.service.js";
import { InMemoryIndicatorRepository } from "./repositories/indicator.repository.js";
import type { IndicatorRepository } from "./repositories/indicator.repository.js";
import { createIOCRouter } from "./threatIntel/ioc.routes.js";
import { createIOCController } from "./threatIntel/ioc.controller.js";
import { IOCService } from "./threatIntel/ioc.service.js";
import { InMemoryAuditLogRepository } from "./repositories/auditLog.repository.js";
import type { AuditLogRepository } from "./repositories/auditLog.repository.js";
import { createAuditRouter } from "./audit/audit.routes.js";
import { createAuditController } from "./audit/audit.controller.js";
import { AuditService } from "./audit/audit.service.js";
import { InMemoryMitreRepository } from "./repositories/mitre.repository.js";
import type { MitreRepository } from "./repositories/mitre.repository.js";
import { seedMitreData } from "./repositories/mitre.seed.js";
import { createMitreRouter } from "./mitre/mitre.routes.js";
import { createMitreController } from "./mitre/mitre.controller.js";
import { MitreService } from "./mitre/mitre.service.js";
import { logger } from "./utils/logger.js";

export interface AppDependencies {
  userRepository: UserRepository;
  incidentRepository: IncidentRepository;
  alertRepository: AlertRepository;
  investigationRepository: InvestigationRepository;
  organizationRepository: OrganizationRepository;
  indicatorRepository: IndicatorRepository;
  auditLogRepository: AuditLogRepository;
  mitreRepository: MitreRepository;
}

/**
 * Defaults to fresh, unseeded in-memory repositories — fine for the health
 * check and for tests that construct/seed their own instances explicitly.
 * server.ts passes real (seeded) ones in for actual runs.
 */
function seedMitreRepository(): MitreRepository {
  const repository = new InMemoryMitreRepository();
  seedMitreData(repository);
  return repository;
}

export function createApp(deps: Partial<AppDependencies> = {}) {
  const userRepository = deps.userRepository ?? new InMemoryUserRepository();
  const incidentRepository = deps.incidentRepository ?? new InMemoryIncidentRepository();
  const alertRepository = deps.alertRepository ?? new InMemoryAlertRepository();
  const investigationRepository = deps.investigationRepository ?? new InMemoryInvestigationRepository();
  const organizationRepository = deps.organizationRepository ?? new InMemoryOrganizationRepository();
  const indicatorRepository = deps.indicatorRepository ?? new InMemoryIndicatorRepository();
  const auditLogRepository = deps.auditLogRepository ?? new InMemoryAuditLogRepository();
  // Unlike the other repositories, MITRE reference data has no meaningful
  // "empty" state — it's static system content, not per-tenant demo data —
  // so the default (when no test/caller supplies its own) is pre-seeded
  // rather than left blank.
  const mitreRepository = deps.mitreRepository ?? seedMitreRepository();

  // Constructed first — every other service below records through it.
  const auditService = new AuditService(auditLogRepository);

  const authService = new AuthService(userRepository, organizationRepository, auditService);
  const authController = createAuthController(authService);
  const authRouter = createAuthRouter(authController);

  const incidentsService = new IncidentsService(incidentRepository, userRepository, auditService);
  const incidentsController = createIncidentsController(incidentsService);
  const incidentsRouter = createIncidentsRouter(incidentsController);

  const alertsService = new AlertsService(alertRepository, userRepository, auditService);
  const alertsController = createAlertsController(alertsService);
  const alertsRouter = createAlertsRouter(alertsController);

  const investigationsService = new InvestigationsService(
    investigationRepository,
    incidentRepository,
    userRepository,
    indicatorRepository,
    auditService,
  );
  const investigationsController = createInvestigationsController(investigationsService);
  const investigationsRouter = createInvestigationsRouter(investigationsController);

  const usersService = new UsersService(userRepository, auditService);
  const usersController = createUsersController(usersService);
  const usersRouter = createUsersRouter(usersController);

  const organizationService = new OrganizationService(organizationRepository, userRepository, auditService);
  const organizationController = createOrganizationController(organizationService);
  const organizationRouter = createOrganizationRouter(organizationController);

  const iocService = new IOCService(indicatorRepository, userRepository, auditService);
  const iocController = createIOCController(iocService);
  const iocRouter = createIOCRouter(iocController);

  const auditController = createAuditController(auditService);
  const auditRouter = createAuditRouter(auditController);

  const mitreService = new MitreService(mitreRepository, incidentRepository);
  const mitreController = createMitreController(mitreService);
  const mitreRouter = createMitreRouter(mitreController);

  const apiV1Router = createApiV1Router({
    authRouter,
    incidentsRouter,
    alertsRouter,
    investigationsRouter,
    usersRouter,
    organizationRouter,
    iocRouter,
    auditRouter,
    mitreRouter,
  });

  const app = express();

  // Trust the first proxy hop (load balancer/reverse proxy) so req.ip and
  // rate limiting see the real client address instead of the proxy's.
  app.set("trust proxy", 1);

  // Request ID first — everything after this (logging, error responses)
  // depends on req.id already being set.
  app.use(requestId);
  // Populates AsyncLocalStorage from req.id/req.ip so services can record
  // audit entries without every method taking them as parameters.
  app.use(requestContextMiddleware);

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
