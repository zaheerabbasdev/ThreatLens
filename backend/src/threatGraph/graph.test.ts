import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";
import { InMemoryIncidentRepository } from "../repositories/incident.repository.js";
import { seedDemoIncidents } from "../repositories/incident.seed.js";
import { InMemoryIndicatorRepository } from "../repositories/indicator.repository.js";
import { seedDemoIndicators } from "../repositories/indicator.seed.js";
import { InMemorySecurityEventRepository } from "../repositories/securityEvent.repository.js";
import type { SecurityEvent } from "../types/securityEvent.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";

async function buildApp(securityEvents: SecurityEvent[] = []) {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  const incidentRepository = new InMemoryIncidentRepository();
  seedDemoIncidents(incidentRepository);
  const indicatorRepository = new InMemoryIndicatorRepository();
  seedDemoIndicators(indicatorRepository);
  const securityEventRepository = new InMemorySecurityEventRepository();
  for (const event of securityEvents) securityEventRepository.seed(event);
  return createApp({ userRepository, incidentRepository, indicatorRepository, securityEventRepository });
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

  describe("correlations", () => {
    it("rejects an unauthenticated request", async () => {
      const app = await buildApp();
      const res = await request(app).get("/api/v1/threat-graph/correlations/ind_1");
      expect(res.status).toBe(401);
    });

    it("returns 404 for a nonexistent indicator", async () => {
      const app = await buildApp();
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/threat-graph/correlations/does-not-exist").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it("IDOR guard: an outsider gets 404 for another org's indicator", async () => {
      const app = await buildApp();
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Outsider",
        organization: "Some Other Company",
        email: "outsider-correlation@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string;
      const res = await request(app).get("/api/v1/threat-graph/correlations/ind_1").set("Authorization", `Bearer ${outsiderToken}`);
      expect(res.status).toBe(404);
    });

    it("finds a shared-domain and shared-tag correlation between the seeded domain and URL indicators", async () => {
      const app = await buildApp();
      const token = await loginAs(app, "avery.chen@northwind.test");
      // ind_4 (domain: secure-office365-verify.com) and ind_5 (url on that
      // same domain) both carry the "phishing" tag in the seed data.
      const res = await request(app).get("/api/v1/threat-graph/correlations/ind_4").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ relatedId: "ind_5", evidenceType: "shared_domain", confidence: "high" }),
          expect.objectContaining({ relatedId: "ind_5", evidenceType: "shared_tag", confidence: "low" }),
        ]),
      );
    });

    it("finds a security event whose sourceIp matches the indicator's value", async () => {
      const app = await buildApp([
        {
          id: "evt_correlate",
          organizationId: "org_northwind",
          type: "network",
          description: "Inbound connection observed",
          severity: "high",
          sourceIp: "185.220.101.47", // matches ind_1's value
          timestamp: "2026-08-16T00:00:00Z",
        },
      ]);
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/threat-graph/correlations/ind_1").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toContainEqual(
        expect.objectContaining({ relatedType: "security_event", relatedId: "evt_correlate", evidenceType: "shared_source_ip", confidence: "high" }),
      );
    });

    it("returns an empty array, not an error, when an indicator has no correlations", async () => {
      const app = await buildApp();
      const token = await loginAs(app, "avery.chen@northwind.test");
      // ind_7 (hash, exfiltration-tool) shares no ASN/domain/malware family/tag with anything else seeded.
      const res = await request(app).get("/api/v1/threat-graph/correlations/ind_7").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
