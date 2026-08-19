import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../errors/AppError.js";
import type { AIService } from "./ai.service.js";
import { askAssistantSchema, reviewRecommendationSchema } from "./ai.schemas.js";

export type AIController = ReturnType<typeof createAIController>;

export function createAIController(service: AIService) {
  return {
    askAssistant: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = askAssistantSchema.parse(req.body);
      const message = await service.askAssistant(req.user.organizationId, req.user.id, input.message, input.incidentId);
      sendSuccess(res, message, undefined, 201);
    }),

    analyzeIncident: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const forceRegenerate = req.query["regenerate"] === "true";
      const analysis = await service.analyzeIncident(req.user.organizationId, req.user.id, req.params["incidentId"]!, forceRegenerate);
      sendSuccess(res, analysis);
    }),

    generateRecommendations: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const recommendations = await service.generateRecommendations(req.user.organizationId, req.user.id, req.params["incidentId"]!);
      sendSuccess(res, recommendations, undefined, 201);
    }),

    listRecommendations: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const recommendations = await service.listRecommendations(req.user.organizationId, req.params["incidentId"]!);
      sendSuccess(res, recommendations);
    }),

    reviewRecommendation: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = reviewRecommendationSchema.parse(req.body);
      const recommendation = await service.reviewRecommendation(
        req.user.organizationId,
        req.user.id,
        req.params["id"]!,
        input.status,
      );
      sendSuccess(res, recommendation);
    }),
  };
}
