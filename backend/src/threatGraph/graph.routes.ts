import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import type { GraphController } from "./graph.controller.js";

export function createGraphRouter(controller: GraphController): Router {
  const router = Router();
  router.use(requireAuth, requirePermission("threat_graph:read"));
  router.get("/", controller.getGraph);
  router.get("/correlations/:indicatorId", controller.getCorrelations);
  return router;
}
