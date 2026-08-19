import type { InMemoryOrganizationRepository } from "./organization.repository.js";

/** Mirrors the frontend's src/mocks/identity.ts MOCK_ORGANIZATION. */
export function seedDemoOrganization(repository: InMemoryOrganizationRepository): void {
  repository.seed({
    id: "org_northwind",
    name: "Northwind Retail Group",
    slug: "northwind-retail",
    plan: "team",
    createdAt: "2024-02-11T09:00:00Z",
  });
}
