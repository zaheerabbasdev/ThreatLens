import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../errors/AppError.js";
import type { GraphService } from "./graph.service.js";

export type GraphController = ReturnType<typeof createGraphController>;

export function createGraphController(service: GraphService) {
  return {
    getGraph: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const graph = await service.getGraph(req.user.organizationId);
      sendSuccess(res, graph);
    }),

    getCorrelations: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const candidates = await service.findCorrelationsFor(req.user.organizationId, req.params["indicatorId"]!);
      sendSuccess(res, candidates);
    }),
  };
}
