import { NotFoundError } from "../errors/AppError.js";
import type { AlertRepository, AlertListParams, AlertSummary } from "../repositories/alert.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { Alert } from "../types/alert.js";
import type { PaginatedResult } from "../types/common.js";
import type { AuditService } from "../audit/audit.service.js";
import { logger } from "../utils/logger.js";

/** Same object-level authorization contract as IncidentsService — see its comment. */
export class AlertsService {
  constructor(
    private readonly alerts: AlertRepository,
    private readonly users: UserRepository,
    private readonly audit: AuditService,
  ) {}

  list(organizationId: string, params: AlertListParams): Promise<PaginatedResult<Alert>> {
    return this.alerts.list(organizationId, params);
  }

  async getById(organizationId: string, id: string): Promise<Alert> {
    const alert = await this.alerts.getById(organizationId, id);
    if (!alert) throw new NotFoundError("The requested alert was not found.");
    return alert;
  }

  getSummary(organizationId: string): Promise<AlertSummary> {
    return this.alerts.getSummary(organizationId);
  }

  async updateStatus(organizationId: string, id: string, status: Alert["status"], actorId: string): Promise<Alert> {
    const updated = await this.alerts.update(organizationId, id, { status });
    if (!updated) throw new NotFoundError("The requested alert was not found.");
    logger.info({ organizationId, alertId: id, status, event: "alert.status_changed" }, "Alert status changed");
    const actor = await this.users.findById(actorId);
    await this.audit.record({
      organizationId,
      actorId,
      actorName: actor?.name ?? "Unknown",
      action: "ALERT_UPDATED",
      resourceType: "alert",
      resourceId: id,
      result: "success",
      severity: "low",
    });
    return updated;
  }
}
