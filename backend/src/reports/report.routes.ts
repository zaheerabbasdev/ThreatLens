import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import type { ReportController } from "./report.controller.js";

export function createReportRouter(controller: ReportController): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", requirePermission("reports:read"), controller.list);
  router.post("/", requirePermission("reports:generate"), controller.create);
  router.get("/:id", requirePermission("reports:read"), controller.getById);

  return router;
}
