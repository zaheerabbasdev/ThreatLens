import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import { createAIRateLimit } from "../middleware/rateLimit.js";
import type { AIController } from "./ai.controller.js";

export function createAIRouter(controller: AIController): Router {
  const router = Router();
  router.use(requireAuth, createAIRateLimit());

  router.post("/assistant", controller.askAssistant);

  router.get("/incidents/:incidentId/analysis", requirePermission("incidents:read"), controller.analyzeIncident);
  router.get("/incidents/:incidentId/recommendations", requirePermission("incidents:read"), controller.listRecommendations);
  router.post("/incidents/:incidentId/recommendations", requirePermission("incidents:write"), controller.generateRecommendations);

  // Human-in-the-loop (spec §58) — the one permission every role EXCEPT
  // viewer/security_analyst lacks (super_admin/security_admin only), same
  // as the frontend's matrix.
  router.post("/recommendations/:id/review", requirePermission("recommendations:approve"), controller.reviewRecommendation);

  return router;
}
