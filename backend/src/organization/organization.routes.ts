import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import type { OrganizationController } from "./organization.controller.js";

export function createOrganizationRouter(controller: OrganizationController): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", requirePermission("settings:read"), controller.getCurrent);
  // "Only Security Admins and Super Admins can rename the organization" —
  // matches the frontend's own copy in Settings > Organization
  // (src/pages/settings/tabs/OrganizationTab.tsx), enforced for real here.
  router.patch("/", requirePermission("settings:manage"), controller.updateName);

  return router;
}
