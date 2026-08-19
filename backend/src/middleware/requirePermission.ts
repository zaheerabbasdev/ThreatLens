import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";
import { roleHasPermission, type Permission } from "../auth/permissions.js";

/**
 * Authorization gate (spec §18: "Authorization answers 'What are you
 * allowed to do?'"). Must run after requireAuth — it throws if req.user
 * isn't already set, rather than silently treating that as "no
 * permission", so a missing requireAuth upstream fails loudly in tests
 * instead of quietly behaving like an authz failure.
 */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError("Authentication is required."));
      return;
    }
    if (!roleHasPermission(req.user.role, permission)) {
      next(new ForbiddenError("You don't have permission to perform this action."));
      return;
    }
    next();
  };
}
