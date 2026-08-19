import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../errors/AppError.js";
import type { AuditService } from "./audit.service.js";
import { listQuerySchema } from "./audit.schemas.js";

export type AuditController = ReturnType<typeof createAuditController>;

export function createAuditController(service: AuditService) {
  return {
    list: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError();
      const query = listQuerySchema.parse(req.query);
      const { page, pageSize, ...filters } = query;
      const result = await service.list(req.user.organizationId, { page, pageSize, ...filters });
      sendSuccess(res, result.items, { total: result.total, page: result.page, pageSize: result.pageSize });
    }),
  };
}
