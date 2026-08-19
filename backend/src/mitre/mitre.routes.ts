import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import type { MitreController } from "./mitre.controller.js";

/**
 * There's no dedicated "mitre:read" permission in the matrix (the frontend
 * doesn't have one either — see src/constants/roles.ts) — gated behind
 * threat_graph:read instead, since MITRE technique data is conceptually
 * part of that same threat-intelligence surface and every seeded role
 * already has that permission, matching the frontend's MITRE browser being
 * reachable without a bespoke permission of its own.
 */
export function createMitreRouter(controller: MitreController): Router {
  const router = Router();
  router.use(requireAuth, requirePermission("threat_graph:read"));

  router.get("/tactics", controller.listTactics);
  router.get("/techniques", controller.listTechniques);
  router.get("/techniques/:id", controller.getTechniqueById);

  return router;
}
