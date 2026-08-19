import { Router } from "express";
import { healthRouter } from "./health.route.js";

/**
 * Versioned API root (spec §74: "/api/v1/", never an inconsistent mix of
 * versioned/unversioned endpoints). Domain routers (auth, incidents,
 * alerts, ...) get mounted here as each is built in a later increment.
 */
export const apiV1Router = Router();

apiV1Router.use("/health", healthRouter);
