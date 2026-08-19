import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import type { IOCController } from "./ioc.controller.js";

export function createIOCRouter(controller: IOCController): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", requirePermission("ioc:read"), controller.list);
  router.post("/", requirePermission("ioc:submit"), controller.submit);
  router.get("/:id", requirePermission("ioc:read"), controller.getById);

  return router;
}
