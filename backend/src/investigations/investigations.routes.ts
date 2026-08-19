import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import type { InvestigationsController } from "./investigations.controller.js";

export function createInvestigationsRouter(controller: InvestigationsController): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", requirePermission("investigations:read"), controller.list);
  router.post("/", requirePermission("investigations:write"), controller.create);
  router.get("/:id", requirePermission("investigations:read"), controller.getById);
  router.patch("/:id/status", requirePermission("investigations:write"), controller.updateStatus);
  router.post("/:id/notes", requirePermission("investigations:write"), controller.addNote);
  router.post("/:id/incidents", requirePermission("investigations:write"), controller.linkIncident);
  router.delete("/:id/incidents/:incidentId", requirePermission("investigations:write"), controller.unlinkIncident);
  router.post("/:id/indicators", requirePermission("investigations:write"), controller.linkIndicator);
  router.delete("/:id/indicators/:indicatorId", requirePermission("investigations:write"), controller.unlinkIndicator);

  return router;
}
