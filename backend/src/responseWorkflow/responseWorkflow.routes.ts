import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import type { ResponseWorkflowController } from "./responseWorkflow.controller.js";

export function createResponseWorkflowRouter(controller: ResponseWorkflowController): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", requirePermission("incidents:read"), controller.list);
  router.post("/", requirePermission("response:request"), controller.request);
  // Execute/reject/apply are all admin-gated (spec: critical actions need
  // human approval by an appropriately privileged role) — same tier as
  // recommendations:approve, not the lower response:request tier above.
  router.post("/:id/execute", requirePermission("response:execute"), controller.execute);
  router.post("/:id/reject", requirePermission("response:execute"), controller.reject);
  router.post("/apply-recommendation/:recommendationId", requirePermission("response:execute"), controller.applyRecommendation);

  return router;
}
