import type { Organization } from "../types/organization.js";

interface SeedableOrganizationRepository {
  seed(org: Organization): void | Promise<void>;
}

/** Mirrors the frontend's src/mocks/identity.ts MOCK_ORGANIZATION. */
export async function seedDemoOrganization(repository: SeedableOrganizationRepository): Promise<void> {
  await repository.seed({
    id: "org_northwind",
    name: "Northwind Retail Group",
    slug: "northwind-retail",
    plan: "team",
    createdAt: "2024-02-11T09:00:00Z",
  });
}
