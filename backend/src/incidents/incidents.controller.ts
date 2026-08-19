import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../errors/AppError.js";
import type { IncidentsService } from "./incidents.service.js";
import { listQuerySchema, updateStatusSchema, assignSchema, addNoteSchema } from "./incidents.schemas.js";

export type IncidentsController = ReturnType<typeof createIncidentsController>;

export function createIncidentsController(service: IncidentsService) {
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
      const incident = await service.getById(req.user.organizationId, req.params["id"]!);
      sendSuccess(res, incident);
    }),

    updateStatus: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = updateStatusSchema.parse(req.body);
      const incident = await service.updateStatus(req.user.organizationId, req.params["id"]!, input.status, req.user.id);
      sendSuccess(res, incident);
    }),

    assign: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = assignSchema.parse(req.body);
      const incident = await service.assign(req.user.organizationId, req.params["id"]!, input.analystId, req.user.id);
      sendSuccess(res, incident);
    }),

    addNote: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = addNoteSchema.parse(req.body);
      const note = await service.addNote(req.user.organizationId, req.params["id"]!, req.user.id, input.content);
      sendSuccess(res, note, undefined, 201);
    }),
  };
}
