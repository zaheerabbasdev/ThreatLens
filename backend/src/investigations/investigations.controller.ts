import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../errors/AppError.js";
import type { InvestigationsService } from "./investigations.service.js";
import {
  listQuerySchema,
  createSchema,
  updateStatusSchema,
  addNoteSchema,
  linkIncidentSchema,
  linkIndicatorSchema,
} from "./investigations.schemas.js";

export type InvestigationsController = ReturnType<typeof createInvestigationsController>;

export function createInvestigationsController(service: InvestigationsService) {
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
      const investigation = await service.getById(req.user.organizationId, req.params["id"]!);
      sendSuccess(res, investigation);
    }),

    create: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = createSchema.parse(req.body);
      const investigation = await service.create(req.user.organizationId, req.user.id, input);
      sendSuccess(res, investigation, undefined, 201);
    }),

    updateStatus: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = updateStatusSchema.parse(req.body);
      const investigation = await service.updateStatus(req.user.organizationId, req.params["id"]!, input.status, req.user.id);
      sendSuccess(res, investigation);
    }),

    addNote: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = addNoteSchema.parse(req.body);
      const note = await service.addNote(req.user.organizationId, req.params["id"]!, req.user.id, input.content, input.isFinding);
      sendSuccess(res, note, undefined, 201);
    }),

    linkIncident: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = linkIncidentSchema.parse(req.body);
      const investigation = await service.linkIncident(req.user.organizationId, req.params["id"]!, input.incidentId, req.user.id);
      sendSuccess(res, investigation);
    }),

    unlinkIncident: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const investigation = await service.unlinkIncident(
        req.user.organizationId,
        req.params["id"]!,
        req.params["incidentId"]!,
        req.user.id,
      );
      sendSuccess(res, investigation);
    }),

    linkIndicator: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const input = linkIndicatorSchema.parse(req.body);
      const investigation = await service.linkIndicator(req.user.organizationId, req.params["id"]!, input.indicatorId, req.user.id);
      sendSuccess(res, investigation);
    }),

    unlinkIndicator: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const investigation = await service.unlinkIndicator(
        req.user.organizationId,
        req.params["id"]!,
        req.params["indicatorId"]!,
        req.user.id,
      );
      sendSuccess(res, investigation);
    }),
  };
}
