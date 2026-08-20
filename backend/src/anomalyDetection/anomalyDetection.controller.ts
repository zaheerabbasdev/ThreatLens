import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../errors/AppError.js";
import type { AnomalyDetectionService } from "./anomalyDetection.service.js";
import { ingestEventSchema, listQuerySchema, analyzeQuerySchema } from "./anomalyDetection.schemas.js";

export type AnomalyDetectionController = ReturnType<typeof createAnomalyDetectionController>;

export function createAnomalyDetectionController(service: AnomalyDetectionService) {
  return {
    ingest: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = ingestEventSchema.parse(req.body);
      const event = await service.ingest(req.user.organizationId, input);
      sendSuccess(res, event, undefined, 201);
    }),

    list: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const { page, pageSize } = listQuerySchema.parse(req.query);
      const result = await service.list(req.user.organizationId, page, pageSize);
      sendSuccess(res, result.items, { total: result.total, page: result.page, pageSize: result.pageSize });
    }),

    analyze: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const { windowHours } = analyzeQuerySchema.parse(req.query);
      const result = await service.analyze(req.user.organizationId, req.user.id, req.params["userId"]!, windowHours);
      sendSuccess(res, result);
    }),
  };
}
