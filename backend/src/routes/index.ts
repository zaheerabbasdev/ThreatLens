import { Router } from "express";
import { healthRouter } from "./health.route.js";

/**
 * Versioned API root (spec §74: "/api/v1/", never an inconsistent mix of
 * versioned/unversioned endpoints). Domain routers (incidents, alerts,
 * users, ...) get mounted here as each is built in a later increment.
 */
export function createApiV1Router(deps: { authRouter: Router }): Router {
  const router = Router();
  router.use("/health", healthRouter);
  router.use("/auth", deps.authRouter);
  return router;
}
