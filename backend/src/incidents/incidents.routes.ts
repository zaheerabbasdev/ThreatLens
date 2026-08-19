import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import type { IncidentsController } from "./incidents.controller.js";

export function createIncidentsRouter(controller: IncidentsController): Router {
  const router = Router();
  router.use(requireAuth);

  // Registered before "/:id" — otherwise "/summary" would match :id first.
  router.get("/summary", requirePermission("incidents:read"), controller.getSummary);

  router.get("/", requirePermission("incidents:read"), controller.list);
  router.get("/:id", requirePermission("incidents:read"), controller.getById);
  router.patch("/:id/status", requirePermission("incidents:write"), controller.updateStatus);
  router.patch("/:id/assign", requirePermission("incidents:assign"), controller.assign);
  router.post("/:id/notes", requirePermission("incidents:write"), controller.addNote);

  return router;
}
