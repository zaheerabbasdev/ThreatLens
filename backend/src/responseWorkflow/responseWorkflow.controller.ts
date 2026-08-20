import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../errors/AppError.js";
import type { ResponseWorkflowService } from "./responseWorkflow.service.js";
import { requestActionSchema, listQuerySchema } from "./responseWorkflow.schemas.js";

export type ResponseWorkflowController = ReturnType<typeof createResponseWorkflowController>;

export function createResponseWorkflowController(service: ResponseWorkflowService) {
  return {
    request: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = requestActionSchema.parse(req.body);
      const action = await service.requestAction(req.user.organizationId, req.user.id, input);
      sendSuccess(res, action, undefined, 201);
    }),

    list: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const { incidentId } = listQuerySchema.parse(req.query);
      const actions = await service.listForIncident(req.user.organizationId, incidentId);
      sendSuccess(res, actions);
    }),

    execute: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const action = await service.executeAction(req.user.organizationId, req.user.id, req.params["id"]!);
      sendSuccess(res, action);
    }),

    reject: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const action = await service.rejectAction(req.user.organizationId, req.user.id, req.params["id"]!);
      sendSuccess(res, action);
    }),

    applyRecommendation: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const action = await service.applyRecommendation(req.user.organizationId, req.user.id, req.params["recommendationId"]!);
      sendSuccess(res, action, undefined, 201);
    }),
  };
}
