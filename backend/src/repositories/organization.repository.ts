import type { Organization } from "../types/organization.js";

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  create(org: Organization): Promise<Organization>;
  update(id: string, patch: Partial<Omit<Organization, "id">>): Promise<Organization | null>;
}

export class InMemoryOrganizationRepository implements OrganizationRepository {
  private readonly orgsById = new Map<string, Organization>();

  async findById(id: string): Promise<Organization | null> {
    return this.orgsById.get(id) ?? null;
  }

  async create(org: Organization): Promise<Organization> {
    this.orgsById.set(org.id, org);
    return { ...org };
  }

  async update(id: string, patch: Partial<Omit<Organization, "id">>): Promise<Organization | null> {
    const existing = this.orgsById.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch };
    this.orgsById.set(id, updated);
    return { ...updated };
  }

  /** Test/seed helper only — never exposed through the interface real callers depend on. */
  seed(org: Organization): void {
    this.orgsById.set(org.id, org);
  }
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "org"
  );
}
