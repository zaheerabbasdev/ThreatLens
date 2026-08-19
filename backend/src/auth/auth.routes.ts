import { Router } from "express";
import { createAuthRateLimit, createSensitiveActionRateLimit } from "../middleware/rateLimit.js";
import { requireAuth } from "../middleware/requireAuth.js";
import type { AuthController } from "./auth.controller.js";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();
  const authRateLimit = createAuthRateLimit();
  const sensitiveActionRateLimit = createSensitiveActionRateLimit();

  // STRICT — brute-force protection on credentialed endpoints (spec §23/§24).
  router.post("/register", authRateLimit, controller.register);
  router.post("/login", authRateLimit, controller.login);
  router.post("/refresh", authRateLimit, controller.refresh);
  router.post("/logout", controller.logout);

  // VERY STRICT — password reset / email verification (spec §23).
  router.post("/forgot-password", sensitiveActionRateLimit, controller.forgotPassword);
  router.post("/reset-password", sensitiveActionRateLimit, controller.resetPassword);
  router.post("/verify-email", sensitiveActionRateLimit, controller.verifyEmail);

  router.get("/me", requireAuth, controller.me);
  router.post("/change-password", requireAuth, sensitiveActionRateLimit, controller.changePassword);

  return router;
}
