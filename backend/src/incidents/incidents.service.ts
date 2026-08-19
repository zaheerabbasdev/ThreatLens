import { randomUUID } from "node:crypto";
import { BadRequestError, NotFoundError } from "../errors/AppError.js";
import type { IncidentRepository, IncidentListParams, IncidentSummary } from "../repositories/incident.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { Incident, IncidentNote } from "../types/incident.js";
import type { PaginatedResult } from "../types/common.js";
import { logger } from "../utils/logger.js";


/**
 * Object-level authorization (spec §19): every method takes the caller's
 * organizationId and passes it straight through to the repository, which
 * is the actual enforcement point. A cross-tenant `GET /incidents/:id`
 * comes back as NotFoundError here — the same error a genuinely nonexistent
 * ID produces — so a client changing the ID in the URL learns nothing about
 * whether a resource with that ID exists in some other organization.
 */
export class IncidentsService {
  constructor(
    private readonly incidents: IncidentRepository,
    private readonly users: UserRepository,
  ) {}

  list(organizationId: string, params: IncidentListParams): Promise<PaginatedResult<Incident>> {
    return this.incidents.list(organizationId, params);
  }

  async getById(organizationId: string, id: string): Promise<Incident> {
    const incident = await this.incidents.getById(organizationId, id);
    if (!incident) throw new NotFoundError("The requested incident was not found.");
    return incident;
  }

  getSummary(organizationId: string): Promise<IncidentSummary> {
    return this.incidents.getSummary(organizationId);
  }

  async updateStatus(organizationId: string, id: string, status: Incident["status"]): Promise<Incident> {
    const updated = await this.incidents.update(organizationId, id, { status, updatedAt: new Date().toISOString() });
    if (!updated) throw new NotFoundError("The requested incident was not found.");
    logger.info({ organizationId, incidentId: id, status, event: "incident.status_changed" }, "Incident status changed");
    return updated;
  }

  async assign(organizationId: string, id: string, analystId: string | null): Promise<Incident> {
    // The primary resource's own existence/ownership is checked before
    // validating anything about the request body — so which error a caller
    // sees never depends on the order fields happen to be checked in, and a
    // cross-tenant probe against a nonexistent-to-them incident always gets
    // the same 404 regardless of what else is wrong with the request.
    const existing = await this.incidents.getById(organizationId, id);
    if (!existing) throw new NotFoundError("The requested incident was not found.");

    if (analystId) {
      // The referenced object (the assignee) must belong to the same
      // organization too — otherwise this is itself a cross-tenant leak,
      // just a one-hop-removed one (spec §19 applies to referenced
      // resources, not only the resource named directly in the URL).
      const user = await this.users.findById(analystId);
      if (!user || user.organizationId !== organizationId) {
        throw new BadRequestError("Assignee must belong to your organization.");
      }
    }

    const updated = await this.incidents.update(organizationId, id, {
      assignedAnalystId: analystId ?? undefined,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw new NotFoundError("The requested incident was not found.");
    logger.info({ organizationId, incidentId: id, analystId, event: "incident.assigned" }, "Incident assigned");
    return updated;
  }

  /**
   * `authorName` is deliberately NOT a caller-supplied field — it's resolved
   * here from the authenticated session's own user record, never trusted
   * from the request body. Accepting a client-provided display name would
   * let any authenticated user attribute a note to whatever name they want.
   */
  async addNote(organizationId: string, incidentId: string, authorId: string, content: string): Promise<IncidentNote> {
    const author = await this.users.findById(authorId);
    if (!author || author.organizationId !== organizationId) {
      throw new BadRequestError("Could not resolve the note author.");
    }
    const note: IncidentNote = {
      id: randomUUID(),
      authorId,
      authorName: author.name,
      content,
      createdAt: new Date().toISOString(),
    };
    const updated = await this.incidents.addNote(organizationId, incidentId, note);
    if (!updated) throw new NotFoundError("The requested incident was not found.");
    return note;
  }
}
