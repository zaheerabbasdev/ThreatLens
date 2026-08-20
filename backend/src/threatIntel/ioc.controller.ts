import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../errors/AppError.js";
import type { IOCService } from "./ioc.service.js";
import { submitSchema, listQuerySchema, enrichQuerySchema } from "./ioc.schemas.js";

export type IOCController = ReturnType<typeof createIOCController>;

export function createIOCController(service: IOCService) {
  return {
    submit: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = submitSchema.parse(req.body);
      const indicator = await service.submit(req.user.organizationId, req.user.id, input);
      sendSuccess(res, indicator, undefined, 201);
    }),

    list: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const query = listQuerySchema.parse(req.query);
      const { page, pageSize, ...filters } = query;
      const result = await service.list(req.user.organizationId, { page, pageSize, ...filters });
      sendSuccess(res, result.items, { total: result.total, page: result.page, pageSize: result.pageSize });
    }),

    getById: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const indicator = await service.getById(req.user.organizationId, req.params["id"]!);
      sendSuccess(res, indicator);
    }),

    enrich: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const query = enrichQuerySchema.parse(req.query);
      const indicator = await service.enrichIndicator(req.user.organizationId, req.user.id, req.params["id"]!, query.force);
      sendSuccess(res, indicator);
    }),
  };
}
