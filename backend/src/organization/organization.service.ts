import { NotFoundError } from "../errors/AppError.js";
import type { OrganizationRepository } from "../repositories/organization.repository.js";
import type { Organization } from "../types/organization.js";

export class OrganizationService {
  constructor(private readonly organizations: OrganizationRepository) {}

  async getCurrent(organizationId: string): Promise<Organization> {
    const org = await this.organizations.findById(organizationId);
    if (!org) throw new NotFoundError("Organization not found.");
    return org;
  }

  async updateName(organizationId: string, name: string): Promise<Organization> {
    const updated = await this.organizations.update(organizationId, { name });
    if (!updated) throw new NotFoundError("Organization not found.");
    return updated;
  }
}
