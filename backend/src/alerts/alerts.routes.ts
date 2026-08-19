import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import type { AlertsController } from "./alerts.controller.js";

export function createAlertsRouter(controller: AlertsController): Router {
  const router = Router();
  router.use(requireAuth);

  // Registered before "/:id" — otherwise "/summary" would match :id first.
  router.get("/summary", requirePermission("alerts:read"), controller.getSummary);

  router.get("/", requirePermission("alerts:read"), controller.list);
  router.get("/:id", requirePermission("alerts:read"), controller.getById);
  router.patch("/:id/status", requirePermission("alerts:write"), controller.updateStatus);

  return router;
}
