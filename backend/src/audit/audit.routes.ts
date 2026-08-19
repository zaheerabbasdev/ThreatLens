import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import type { AuditController } from "./audit.controller.js";

/**
 * Read-only on purpose (spec §39: restricted write access, no deletion) —
 * there's no POST route here. Audit entries are only ever created as a
 * side effect of a real action, by services calling AuditService.record()
 * directly; nothing accepts an arbitrary audit entry from a client.
 */
export function createAuditRouter(controller: AuditController): Router {
  const router = Router();
  router.use(requireAuth);
  router.get("/", requirePermission("audit:read"), controller.list);
  return router;
}
