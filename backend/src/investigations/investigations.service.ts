import { randomUUID } from "node:crypto";
import { BadRequestError, NotFoundError } from "../errors/AppError.js";
import type {
  InvestigationRepository,
  InvestigationListParams,
} from "../repositories/investigation.repository.js";
import type { IncidentRepository } from "../repositories/incident.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { IndicatorRepository } from "../repositories/indicator.repository.js";
import type { Investigation, InvestigationNote, InvestigationTimelineEvent } from "../types/investigation.js";
import type { PaginatedResult, WorkflowStatus } from "../types/common.js";
import type { AuditService } from "../audit/audit.service.js";
import { logger } from "../utils/logger.js";

function timelineEvent(title: string, description: string, actor: string): InvestigationTimelineEvent {
  return { id: randomUUID(), timestamp: new Date().toISOString(), title, description, actor };
}

/**
 * Same object-level-authorization contract as IncidentsService — every
 * method takes organizationId and every cross-referenced object (lead
 * analyst, linked incident) is checked against it too, not just the
 * investigation itself.
 */
export class InvestigationsService {
  constructor(
    private readonly investigations: InvestigationRepository,
    private readonly incidents: IncidentRepository,
    private readonly users: UserRepository,
    private readonly indicators: IndicatorRepository,
    private readonly audit: AuditService,
  ) {}

  list(organizationId: string, params: InvestigationListParams): Promise<PaginatedResult<Investigation>> {
    return this.investigations.list(organizationId, params);
  }

  async getById(organizationId: string, id: string): Promise<Investigation> {
    const investigation = await this.investigations.getById(organizationId, id);
    if (!investigation) throw new NotFoundError("The requested investigation was not found.");
    return investigation;
  }

  async create(
    organizationId: string,
    creatorId: string,
    input: { title: string; description: string; leadAnalystId: string },
  ): Promise<Investigation> {
    const [creator, lead] = await Promise.all([
      this.users.findById(creatorId),
      this.users.findById(input.leadAnalystId),
    ]);
    if (!creator) throw new BadRequestError("Could not resolve the creating user.");
    if (!lead || lead.organizationId !== organizationId) {
      throw new BadRequestError("Lead analyst must belong to your organization.");
    }

    const now = new Date().toISOString();
    const investigation: Investigation = {
      id: randomUUID(),
      organizationId,
      title: input.title,
      description: input.description,
      leadAnalystId: input.leadAnalystId,
      status: "open",
      relatedIncidentIds: [],
      relatedIndicatorIds: [],
      notes: [],
      timeline: [timelineEvent("Investigation opened", input.description || "Investigation opened.", creator.name)],
      createdAt: now,
      updatedAt: now,
    };
    const created = await this.investigations.create(investigation);
    logger.info({ organizationId, investigationId: created.id, event: "investigation.created" }, "Investigation created");
    await this.audit.record({
      organizationId,
      actorId: creatorId,
      actorName: creator.name,
      action: "INVESTIGATION_CREATED",
      resourceType: "investigation",
      resourceId: created.id,
      result: "success",
      severity: "info",
    });
    return created;
  }

  async updateStatus(organizationId: string, id: string, status: WorkflowStatus, actorId: string): Promise<Investigation> {
    const actor = await this.requireActor(organizationId, actorId);
    const existing = await this.investigations.getById(organizationId, id);
    if (!existing) throw new NotFoundError("The requested investigation was not found.");

    const updated = await this.investigations.update(organizationId, id, {
      status,
      timeline: [...existing.timeline, timelineEvent("Status changed", `Marked ${status.replace("_", " ")}.`, actor.name)],
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw new NotFoundError("The requested investigation was not found.");
    await this.audit.record({
      organizationId,
      actorId,
      actorName: actor.name,
      action: "INVESTIGATION_UPDATED",
      resourceType: "investigation",
      resourceId: id,
      result: "success",
      severity: "low",
    });
    return updated;
  }

  // Finer-grained changes below (notes, incident/indicator links) are
  // already captured in the investigation's own timeline, which is that
  // resource's audit trail; they don't also get a separate AuditLog entry
  // — this module reserves that for the cross-cutting, security-relevant
  // events spec §38 lists (create/status-change), not every field edit.

  /** authorName is resolved server-side from the session — never trusted from the request body (same reasoning as IncidentsService.addNote). */
  async addNote(
    organizationId: string,
    id: string,
    authorId: string,
    content: string,
    isFinding: boolean,
  ): Promise<InvestigationNote> {
    const author = await this.requireActor(organizationId, authorId);
    const existing = await this.investigations.getById(organizationId, id);
    if (!existing) throw new NotFoundError("The requested investigation was not found.");

    const note: InvestigationNote = {
      id: randomUUID(),
      authorId,
      authorName: author.name,
      content,
      createdAt: new Date().toISOString(),
      isFinding,
    };

    const updated = await this.investigations.addNote(organizationId, id, note);
    if (!updated) throw new NotFoundError("The requested investigation was not found.");

    if (isFinding) {
      await this.investigations.update(organizationId, id, {
        timeline: [...updated.timeline, timelineEvent("Finding noted", content, author.name)],
      });
    }
    return note;
  }

  async linkIncident(organizationId: string, id: string, incidentId: string, actorId: string): Promise<Investigation> {
    const actor = await this.requireActor(organizationId, actorId);
    const existing = await this.investigations.getById(organizationId, id);
    if (!existing) throw new NotFoundError("The requested investigation was not found.");

    if (existing.relatedIncidentIds.includes(incidentId)) return existing;

    // Unlike the frontend mock, a nonexistent/cross-org incident is
    // rejected outright rather than silently linked with a dangling
    // reference — spec §19's object-level check applies to what gets
    // linked, not only to the investigation being modified.
    const incident = await this.incidents.getById(organizationId, incidentId);
    if (!incident) throw new BadRequestError("That incident doesn't exist in your organization.");

    const updated = await this.investigations.update(organizationId, id, {
      relatedIncidentIds: [...existing.relatedIncidentIds, incidentId],
      timeline: [...existing.timeline, timelineEvent("Linked incident", incident.title, actor.name)],
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw new NotFoundError("The requested investigation was not found.");
    return updated;
  }

  async unlinkIncident(organizationId: string, id: string, incidentId: string, actorId: string): Promise<Investigation> {
    const actor = await this.requireActor(organizationId, actorId);
    const existing = await this.investigations.getById(organizationId, id);
    if (!existing) throw new NotFoundError("The requested investigation was not found.");

    const updated = await this.investigations.update(organizationId, id, {
      relatedIncidentIds: existing.relatedIncidentIds.filter((i) => i !== incidentId),
      timeline: [...existing.timeline, timelineEvent("Unlinked incident", incidentId, actor.name)],
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw new NotFoundError("The requested investigation was not found.");
    return updated;
  }

  async linkIndicator(organizationId: string, id: string, indicatorId: string, actorId: string): Promise<Investigation> {
    const actor = await this.requireActor(organizationId, actorId);
    const existing = await this.investigations.getById(organizationId, id);
    if (!existing) throw new NotFoundError("The requested investigation was not found.");

    if (existing.relatedIndicatorIds.includes(indicatorId)) return existing;

    // Same object-level check as linkIncident, now that the Threat Intel
    // module (and its repository) exists to check against.
    const indicator = await this.indicators.getById(organizationId, indicatorId);
    if (!indicator) throw new BadRequestError("That indicator doesn't exist in your organization.");

    const updated = await this.investigations.update(organizationId, id, {
      relatedIndicatorIds: [...existing.relatedIndicatorIds, indicatorId],
      timeline: [...existing.timeline, timelineEvent("Linked indicator", indicator.value, actor.name)],
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw new NotFoundError("The requested investigation was not found.");
    return updated;
  }

  async unlinkIndicator(organizationId: string, id: string, indicatorId: string, actorId: string): Promise<Investigation> {
    const actor = await this.requireActor(organizationId, actorId);
    const existing = await this.investigations.getById(organizationId, id);
    if (!existing) throw new NotFoundError("The requested investigation was not found.");

    const updated = await this.investigations.update(organizationId, id, {
      relatedIndicatorIds: existing.relatedIndicatorIds.filter((i) => i !== indicatorId),
      timeline: [...existing.timeline, timelineEvent("Unlinked indicator", indicatorId, actor.name)],
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw new NotFoundError("The requested investigation was not found.");
    return updated;
  }

  private async requireActor(organizationId: string, userId: string) {
    const user = await this.users.findById(userId);
    if (!user || user.organizationId !== organizationId) {
      throw new BadRequestError("Could not resolve the acting user.");
    }
    return user;
  }
}
