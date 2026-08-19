import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";
import { InMemoryIncidentRepository } from "../repositories/incident.repository.js";
import { seedDemoIncidents } from "../repositories/incident.seed.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";

async function buildApp() {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  const incidentRepository = new InMemoryIncidentRepository();
  seedDemoIncidents(incidentRepository);
  // mitreRepository intentionally omitted — createApp() auto-seeds it by default.
  return createApp({ userRepository, incidentRepository });
}

async function loginAs(app: Awaited<ReturnType<typeof buildApp>>, email: string): Promise<string> {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: DEMO_PASSWORD });
  return res.body.data.accessToken as string;
}

describe("mitre", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe("authorization", () => {
    it("rejects an unauthenticated request", async () => {
      const res = await request(app).get("/api/v1/mitre/tactics");
      expect(res.status).toBe(401);
    });

    it("every seeded role (all have threat_graph:read) can browse MITRE data", async () => {
      const token = await loginAs(app, "sam.whitfield@northwind.test"); // viewer
      const res = await request(app).get("/api/v1/mitre/tactics").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe("listTactics", () => {
    it("returns all 8 seeded tactics", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/mitre/tactics").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(8);
      expect(res.body.data.map((t: { id: string }) => t.id)).toContain("TA0001");
    });
  });

  describe("listTechniques", () => {
    it("returns all techniques with mapped incidents computed for this org", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/mitre/techniques").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      const phishing = res.body.data.find((t: { id: string }) => t.id === "T1566");
      expect(phishing.mappedIncidentIds).toContain("inc_1"); // seeded incident references T1566
      expect(phishing.mappedIndicatorIds).toEqual(expect.arrayContaining(["ind_4", "ind_5"])); // inc_1's own indicatorIds
    });

    it("filters by tacticId", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app)
        .get("/api/v1/mitre/techniques?tacticId=TA0001")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.every((t: { tacticIds: string[] }) => t.tacticIds.includes("TA0001"))).toBe(true);
    });

    it("filters by search", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/mitre/techniques?search=brute").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe("T1110");
    });

    it("tenant isolation: an outsider org with no incidents sees the same techniques with empty mappings", async () => {
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Outsider",
        organization: "Some Other Company",
        email: "outsider-mitre@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string;

      const res = await request(app).get("/api/v1/mitre/techniques").set("Authorization", `Bearer ${outsiderToken}`);
      expect(res.status).toBe(200);
      // Same 8 shared techniques exist for every org...
      expect(res.body.data).toHaveLength(8);
      // ...but none of org_northwind's incident IDs leak into this org's view.
      const phishing = res.body.data.find((t: { id: string }) => t.id === "T1566");
      expect(phishing.mappedIncidentIds).toEqual([]);
      expect(phishing.mappedIndicatorIds).toEqual([]);
    });
  });

  describe("getTechniqueById", () => {
    it("returns a technique with sub-technique parent info", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/mitre/techniques/T1566.002").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ isSubTechnique: true, parentTechniqueId: "T1566" });
    });

    it("returns 404 for a nonexistent technique", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/mitre/techniques/T9999").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
