import { NotFoundError } from "../errors/AppError.js";
import type { OrganizationRepository } from "../repositories/organization.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { Organization } from "../types/organization.js";
import type { AuditService } from "../audit/audit.service.js";

export class OrganizationService {
  constructor(
    private readonly organizations: OrganizationRepository,
    private readonly users: UserRepository,
    private readonly audit: AuditService,
  ) {}

  async getCurrent(organizationId: string): Promise<Organization> {
    const org = await this.organizations.findById(organizationId);
    if (!org) throw new NotFoundError("Organization not found.");
    return org;
  }

  async updateName(organizationId: string, actorId: string, name: string): Promise<Organization> {
    const updated = await this.organizations.update(organizationId, { name });
    if (!updated) throw new NotFoundError("Organization not found.");
    const actor = await this.users.findById(actorId);
    await this.audit.record({
      organizationId,
      actorId,
      actorName: actor?.name ?? "Unknown",
      action: "SECURITY_SETTING_CHANGED",
      resourceType: "organization",
      resourceId: organizationId,
      result: "success",
      severity: "medium",
    });
    return updated;
  }
}
