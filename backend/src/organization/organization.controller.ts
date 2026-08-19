import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../errors/AppError.js";
import type { OrganizationService } from "./organization.service.js";
import { updateNameSchema } from "./organization.schemas.js";

export type OrganizationController = ReturnType<typeof createOrganizationController>;

export function createOrganizationController(service: OrganizationService) {
  return {
    getCurrent: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const org = await service.getCurrent(req.user.organizationId);
      sendSuccess(res, org);
    }),

    updateName: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = updateNameSchema.parse(req.body);
      const org = await service.updateName(req.user.organizationId, input.name);
      sendSuccess(res, org);
    }),
  };
}
