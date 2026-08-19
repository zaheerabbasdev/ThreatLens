import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../errors/AppError.js";
import type { AlertsService } from "./alerts.service.js";
import { listQuerySchema, updateStatusSchema } from "./alerts.schemas.js";

export type AlertsController = ReturnType<typeof createAlertsController>;

export function createAlertsController(service: AlertsService) {
  return {
    list: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const query = listQuerySchema.parse(req.query);
      const { page, pageSize, ...filters } = query;
      const result = await service.list(req.user.organizationId, { page, pageSize, ...filters });
      sendSuccess(res, result.items, { total: result.total, page: result.page, pageSize: result.pageSize });
    }),

    getSummary: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const summary = await service.getSummary(req.user.organizationId);
      sendSuccess(res, summary);
    }),

    getById: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const alert = await service.getById(req.user.organizationId, req.params["id"]!);
      sendSuccess(res, alert);
    }),

    updateStatus: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = updateStatusSchema.parse(req.body);
      const alert = await service.updateStatus(req.user.organizationId, req.params["id"]!, input.status, req.user.id);
      sendSuccess(res, alert);
    }),
  };
}
