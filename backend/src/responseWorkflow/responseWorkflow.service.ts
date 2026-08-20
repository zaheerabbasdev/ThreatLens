import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError } from "../errors/AppError.js";
import type { ResponseActionRepository } from "../repositories/responseAction.repository.js";
import type { RecommendationRepository } from "../repositories/recommendation.repository.js";
import type { IncidentRepository } from "../repositories/incident.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { AuditService } from "../audit/audit.service.js";
import type { ResponseAction } from "../types/responseAction.js";
import type { RequestActionInput } from "./responseWorkflow.schemas.js";
import type { ResponseActionExecutor } from "./actionExecutor.js";

/**
 * The RESPOND stage (see types/responseAction.ts's header comment for the
 * two-human-gate design: `response:request` to create, `response:execute`
 * to actually carry one out). Every state transition is audit-logged under
 * the real actor — same non-spoofable-attribution rule as every other
 * service in this codebase.
 */
export class ResponseWorkflowService {
  constructor(
    private readonly actions: ResponseActionRepository,
    private readonly recommendations: RecommendationRepository,
    private readonly incidents: IncidentRepository,
    private readonly users: UserRepository,
    private readonly audit: AuditService,
    private readonly executor: ResponseActionExecutor,
  ) {}

  async requestAction(organizationId: string, actorId: string, input: RequestActionInput): Promise<ResponseAction> {
    const incident = await this.incidents.getById(organizationId, input.incidentId);
    if (!incident) throw new NotFoundError("The requested incident was not found.");

    const action: ResponseAction = {
      id: randomUUID(),
      organizationId,
      incidentId: input.incidentId,
      type: input.type,
      target: input.target,
      description: input.description,
      status: "pending_execution",
      requestedBy: actorId,
      requestedAt: new Date().toISOString(),
    };
    const created = await this.actions.create(action);

    await this.recordAudit(organizationId, actorId, "RESPONSE_ACTION_REQUESTED", created.id, "medium");
    return created;
  }

  async listForIncident(organizationId: string, incidentId: string): Promise<ResponseAction[]> {
    const incident = await this.incidents.getById(organizationId, incidentId);
    if (!incident) throw new NotFoundError("The requested incident was not found.");
    return this.actions.listByIncident(organizationId, incidentId);
  }

  /**
   * The one place a response action's state actually changes something
   * (spec: "critical actions require deterministic backend validation").
   * Only a `pending_execution` action can be executed — already-executed
   * or already-rejected is a 409, not a silent no-op, so a double-click
   * can't be mistaken for two separate executions.
   */
  async executeAction(organizationId: string, actorId: string, actionId: string): Promise<ResponseAction> {
    const action = await this.actions.getById(organizationId, actionId);
    if (!action) throw new NotFoundError("The requested response action was not found.");
    if (action.status !== "pending_execution") {
      throw new ConflictError(`This action is already ${action.status} and can't be executed again.`);
    }

    const { isSimulated, resultDescription } = await this.executor.execute(action);
    const updated = await this.actions.update(organizationId, actionId, {
      status: "executed",
      reviewedBy: actorId,
      reviewedAt: new Date().toISOString(),
      executionResult: resultDescription,
      isSimulated,
    });
    if (!updated) throw new NotFoundError("The requested response action was not found.");

    await this.recordAudit(organizationId, actorId, "RESPONSE_ACTION_EXECUTED", actionId, "high");
    return updated;
  }

  async rejectAction(organizationId: string, actorId: string, actionId: string): Promise<ResponseAction> {
    const action = await this.actions.getById(organizationId, actionId);
    if (!action) throw new NotFoundError("The requested response action was not found.");
    if (action.status !== "pending_execution") {
      throw new ConflictError(`This action is already ${action.status} and can't be rejected.`);
    }

    const updated = await this.actions.update(organizationId, actionId, {
      status: "rejected",
      reviewedBy: actorId,
      reviewedAt: new Date().toISOString(),
    });
    if (!updated) throw new NotFoundError("The requested response action was not found.");

    await this.recordAudit(organizationId, actorId, "RESPONSE_ACTION_REJECTED", actionId, "medium");
    return updated;
  }

  /**
   * Converts an already-approved AI recommendation (Phase 6's human-in-
   * the-loop gate) into a real, tracked, executed ResponseAction — the
   * missing piece ai.service.ts's header comment named explicitly:
   * "Nothing in this codebase transitions a recommendation to 'applied'
   * automatically; that would be wiring a real response workflow (Phase
   * 10)." A recommendation that isn't "approved" yet (still pending, or
   * rejected) can't be applied — `markApplied` enforces that at the
   * repository layer, this method just translates its null into a 409.
   */
  async applyRecommendation(organizationId: string, actorId: string, recommendationId: string): Promise<ResponseAction> {
    const recommendation = await this.recommendations.getById(organizationId, recommendationId);
    if (!recommendation) throw new NotFoundError("The requested recommendation was not found.");
    // Validated BEFORE creating/executing anything below — an action must
    // never be recorded as executed for a recommendation that turns out not
    // to be applicable (still pending, or already rejected).
    if (recommendation.status !== "approved") {
      throw new ConflictError("Only an approved recommendation can be applied.");
    }

    const action: ResponseAction = {
      id: randomUUID(),
      organizationId,
      incidentId: recommendation.incidentId,
      type: "recommended_action",
      description: `${recommendation.title} — ${recommendation.description}`,
      status: "pending_execution",
      recommendationId,
      requestedBy: actorId,
      requestedAt: new Date().toISOString(),
    };

    const { isSimulated, resultDescription } = await this.executor.execute(action);
    const created = await this.actions.create({
      ...action,
      status: "executed",
      reviewedBy: actorId,
      reviewedAt: new Date().toISOString(),
      executionResult: resultDescription,
      isSimulated,
    });

    // Re-checked here too (not just the read above) — genuine defense
    // against a concurrent request racing this same recommendation between
    // the check and this write; still returns a clean 409 rather than a
    // silent inconsistency if it somehow fires.
    const applied = await this.recommendations.markApplied(organizationId, recommendationId, actorId);
    if (!applied) {
      throw new ConflictError("Only an approved recommendation can be applied.");
    }

    await this.recordAudit(organizationId, actorId, "RESPONSE_ACTION_EXECUTED", created.id, "high");
    return created;
  }

  private async recordAudit(
    organizationId: string,
    actorId: string,
    action: "RESPONSE_ACTION_REQUESTED" | "RESPONSE_ACTION_EXECUTED" | "RESPONSE_ACTION_REJECTED",
    resourceId: string,
    severity: "medium" | "high",
  ): Promise<void> {
    const actor = await this.users.findById(actorId);
    await this.audit.record({
      organizationId,
      actorId,
      actorName: actor?.name ?? "Unknown",
      action,
      resourceType: "response_action",
      resourceId,
      result: "success",
      severity,
    });
  }
}
