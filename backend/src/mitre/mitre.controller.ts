import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../errors/AppError.js";
import type { MitreService } from "./mitre.service.js";
import { listTechniquesQuerySchema } from "./mitre.schemas.js";

export type MitreController = ReturnType<typeof createMitreController>;

export function createMitreController(service: MitreService) {
  return {
    listTactics: asyncHandler(async (_req, res) => {
      const tactics = await service.listTactics();
      sendSuccess(res, tactics);
    }),

    listTechniques: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const query = listTechniquesQuerySchema.parse(req.query);
      const techniques = await service.listTechniques(req.user.organizationId, query);
      sendSuccess(res, techniques);
    }),

    getTechniqueById: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const technique = await service.getTechniqueById(req.user.organizationId, req.params["id"]!);
      sendSuccess(res, technique);
    }),
  };
}
