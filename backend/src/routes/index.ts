import { Router } from "express";
import { healthRouter } from "./health.route.js";

/**
 * Versioned API root (spec §74: "/api/v1/", never an inconsistent mix of
 * versioned/unversioned endpoints). Domain routers (alerts, users, ...) get
 * mounted here as each is built in a later increment.
 */
export function createApiV1Router(deps: {
  authRouter: Router;
  incidentsRouter: Router;
  alertsRouter: Router;
  investigationsRouter: Router;
  usersRouter: Router;
  organizationRouter: Router;
  iocRouter: Router;
  auditRouter: Router;
  mitreRouter: Router;
  reportRouter: Router;
  graphRouter: Router;
  aiRouter: Router;
  anomalyDetectionRouter: Router;
  responseWorkflowRouter: Router;
}): Router {
  const router = Router();
  router.use("/health", healthRouter);
  router.use("/auth", deps.authRouter);
  router.use("/incidents", deps.incidentsRouter);
  router.use("/alerts", deps.alertsRouter);
  router.use("/investigations", deps.investigationsRouter);
  router.use("/users", deps.usersRouter);
  router.use("/organization", deps.organizationRouter);
  router.use("/ioc", deps.iocRouter);
  router.use("/audit-logs", deps.auditRouter);
  router.use("/mitre", deps.mitreRouter);
  router.use("/reports", deps.reportRouter);
  router.use("/threat-graph", deps.graphRouter);
  router.use("/ai", deps.aiRouter);
  router.use("/security-events", deps.anomalyDetectionRouter);
  router.use("/response-actions", deps.responseWorkflowRouter);
  return router;
}
