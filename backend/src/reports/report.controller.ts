import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../errors/AppError.js";
import type { ReportService } from "./report.service.js";
import { listQuerySchema, createSchema } from "./report.schemas.js";

export type ReportController = ReturnType<typeof createReportController>;

export function createReportController(service: ReportService) {
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
      const report = await service.getById(req.user.organizationId, req.params["id"]!);
      sendSuccess(res, report);
    }),

    create: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = createSchema.parse(req.body);
      const report = await service.create(req.user.organizationId, req.user.id, input);
      sendSuccess(res, report, undefined, 201);
    }),
  };
}
