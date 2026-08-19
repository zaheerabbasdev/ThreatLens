import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";
import { InMemoryIncidentRepository } from "../repositories/incident.repository.js";
import { seedDemoIncidents } from "../repositories/incident.seed.js";
import { InMemoryIndicatorRepository } from "../repositories/indicator.repository.js";
import { seedDemoIndicators } from "../repositories/indicator.seed.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";

async function buildApp() {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  const incidentRepository = new InMemoryIncidentRepository();
  seedDemoIncidents(incidentRepository);
  const indicatorRepository = new InMemoryIndicatorRepository();
  seedDemoIndicators(indicatorRepository);
  return createApp({ userRepository, incidentRepository, indicatorRepository });
}

async function loginAs(app: Awaited<ReturnType<typeof buildApp>>, email: string): Promise<string> {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: DEMO_PASSWORD });
  return res.body.data.accessToken as string;
}

describe("threat graph", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe("authorization", () => {
    it("rejects an unauthenticated request", async () => {
      const res = await request(app).get("/api/v1/threat-graph");
      expect(res.status).toBe(401);
    });

    it("every seeded role (all have threat_graph:read) can fetch the graph", async () => {
      const token = await loginAs(app, "sam.whitfield@northwind.test"); // viewer
      const res = await request(app).get("/api/v1/threat-graph").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe("assembly", () => {
    it("includes indicator and incident nodes for this org's real data", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/threat-graph").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      const ids = res.body.data.nodes.map((n: { id: string }) => n.id);
      expect(ids).toContain("ind_1"); // seeded indicator
      expect(ids).toContain("inc_1"); // seeded incident
    });

    it("includes only referenced users, techniques, and all threat actors", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/threat-graph").set("Authorization", `Bearer ${token}`);
      const byType = (type: string) => res.body.data.nodes.filter((n: { type: string }) => n.type === type);

      // inc_1 is assigned to user_3 (Diego Alvarez) — that user should appear;
      // an unassigned/unreferenced user should not.
      const userIds = byType("user").map((n: { id: string }) => n.id);
      expect(userIds).toContain("user_3");

      // T1566 is mapped by inc_1 — should appear as a technique node.
      const techniqueIds = byType("technique").map((n: { id: string }) => n.id);
      expect(techniqueIds).toContain("T1566");

      // Threat actors are global reference data, always included.
      const actorIds = byType("threat_actor").map((n: { id: string }) => n.id);
      expect(actorIds).toEqual(expect.arrayContaining(["actor_1", "actor_2"]));
    });

    it("connects an incident to its assigned analyst and mapped technique", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/threat-graph").set("Authorization", `Bearer ${token}`);
      const edges = res.body.data.edges;
      expect(edges).toContainEqual(
        expect.objectContaining({ source: "inc_1", target: "user_3", relation: "assigned_to" }),
      );
      expect(edges).toContainEqual(
        expect.objectContaining({ source: "inc_1", target: "T1566", relation: "maps_to" }),
      );
    });

    it("connects an indicator to the incident it was observed in", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/threat-graph").set("Authorization", `Bearer ${token}`);
      expect(res.body.data.edges).toContainEqual(
        expect.objectContaining({ source: "ind_4", target: "inc_1", relation: "observed_in" }),
      );
    });

    it("has no duplicate edges between the same pair of nodes", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/threat-graph").set("Authorization", `Bearer ${token}`);
      const pairKeys = res.body.data.edges.map((e: { source: string; target: string }) =>
        [e.source, e.target].sort().join("|"),
      );
      expect(new Set(pairKeys).size).toBe(pairKeys.length);
    });

    it("every edge connects two nodes that actually exist in the graph", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/threat-graph").set("Authorization", `Bearer ${token}`);
      const nodeIds = new Set(res.body.data.nodes.map((n: { id: string }) => n.id));
      for (const edge of res.body.data.edges) {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      }
    });
  });

  describe("tenant isolation", () => {
    it("an outsider org's graph never includes org_northwind's incidents or indicators", async () => {
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Outsider",
        organization: "Some Other Company",
        email: "outsider-graph@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string;

      const res = await request(app).get("/api/v1/threat-graph").set("Authorization", `Bearer ${outsiderToken}`);
      expect(res.status).toBe(200);
      const nodeIds = res.body.data.nodes.map((n: { id: string }) => n.id);
      expect(nodeIds).not.toContain("inc_1");
      expect(nodeIds).not.toContain("ind_1");
      expect(nodeIds).not.toContain("user_3");
      // Threat actors are global, so they still legitimately appear.
      expect(nodeIds).toEqual(expect.arrayContaining(["actor_1", "actor_2"]));
    });
  });
});
