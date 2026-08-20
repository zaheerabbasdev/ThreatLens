import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { createAnomalyRateLimit } from "../middleware/rateLimit.js";
import type { AnomalyDetectionController } from "./anomalyDetection.controller.js";

export function createAnomalyDetectionRouter(controller: AnomalyDetectionController): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", requirePermission("anomaly:read"), controller.list);
  router.post("/", requirePermission("anomaly:detect"), controller.ingest);
  router.post("/analyze/:userId", requirePermission("anomaly:detect"), createAnomalyRateLimit(), controller.analyze);

  return router;
}
