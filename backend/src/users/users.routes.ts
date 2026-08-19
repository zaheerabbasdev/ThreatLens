import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import type { UsersController } from "./users.controller.js";

export function createUsersRouter(controller: UsersController): Router {
  const router = Router();
  router.use(requireAuth);

  // Admin directory — viewing the user list/detail requires users:read
  // (which viewer and security_analyst don't have; see auth/permissions.ts).
  router.get("/", requirePermission("users:read"), controller.list);
  router.get("/:id", requirePermission("users:read"), controller.getById);

  // Self-service — every authenticated role can edit their OWN profile and
  // MFA setting regardless of users:read/users:manage. The self-or-admin
  // check lives in the service layer, not here, since it depends on
  // *whose* record is being touched, not just who's calling.
  router.patch("/:id/profile", controller.updateProfile);
  router.patch("/:id/mfa", controller.setMfaEnabled);

  // Admin-only — role/status changes, and never on your own account
  // (enforced in the service).
  router.patch("/:id/role", requirePermission("users:manage"), controller.updateRole);
  router.patch("/:id/status", requirePermission("users:manage"), controller.updateStatus);

  return router;
}
