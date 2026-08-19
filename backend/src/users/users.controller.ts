import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../errors/AppError.js";
import { roleHasPermission } from "../auth/permissions.js";
import type { UsersService } from "./users.service.js";
import {
  listQuerySchema,
  updateRoleSchema,
  updateStatusSchema,
  updateProfileSchema,
  setMfaEnabledSchema,
} from "./users.schemas.js";

export type UsersController = ReturnType<typeof createUsersController>;

export function createUsersController(service: UsersService) {
  return {
    list: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const query = listQuerySchema.parse(req.query);
      const { page, pageSize, ...filters } = query;
      const result = await service.list(req.user.organizationId, { page, pageSize, ...filters });
      sendSuccess(res, result.items, { total: result.total, page: result.page, pageSize: result.pageSize });
    }),

    getById: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const user = await service.getById(req.user.organizationId, req.params["id"]!);
      sendSuccess(res, user);
    }),

    updateProfile: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = updateProfileSchema.parse(req.body);
      const canManage = roleHasPermission(req.user.role, "users:manage");
      const user = await service.updateProfile(req.user.organizationId, req.user.id, canManage, req.params["id"]!, input);
      sendSuccess(res, user);
    }),

    setMfaEnabled: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = setMfaEnabledSchema.parse(req.body);
      const canManage = roleHasPermission(req.user.role, "users:manage");
      const user = await service.setMfaEnabled(req.user.organizationId, req.user.id, canManage, req.params["id"]!, input.enabled);
      sendSuccess(res, user);
    }),

    updateRole: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = updateRoleSchema.parse(req.body);
      const user = await service.updateRole(req.user.organizationId, req.user.id, req.params["id"]!, input.role);
      sendSuccess(res, user);
    }),

    updateStatus: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = updateStatusSchema.parse(req.body);
      const user = await service.updateStatus(req.user.organizationId, req.user.id, req.params["id"]!, input.status);
      sendSuccess(res, user);
    }),
  };
}
