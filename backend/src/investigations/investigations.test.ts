import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";
import { InMemoryIncidentRepository } from "../repositories/incident.repository.js";
import { seedDemoIncidents } from "../repositories/incident.seed.js";
import { InMemoryInvestigationRepository } from "../repositories/investigation.repository.js";
import { seedDemoInvestigations } from "../repositories/investigation.seed.js";
import { InMemoryIndicatorRepository } from "../repositories/indicator.repository.js";
import { seedDemoIndicators } from "../repositories/indicator.seed.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";

async function buildApp() {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  const incidentRepository = new InMemoryIncidentRepository();
  seedDemoIncidents(incidentRepository);
  const investigationRepository = new InMemoryInvestigationRepository();
  seedDemoInvestigations(investigationRepository);
  const indicatorRepository = new InMemoryIndicatorRepository();
  seedDemoIndicators(indicatorRepository);
  return createApp({ userRepository, incidentRepository, investigationRepository, indicatorRepository });
}

async function loginAs(app: Awaited<ReturnType<typeof buildApp>>, email: string): Promise<string> {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: DEMO_PASSWORD });
  return res.body.data.accessToken as string;
}

describe("investigations", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe("authentication and authorization", () => {
    it("rejects an unauthenticated request", async () => {
      const res = await request(app).get("/api/v1/investigations");
      expect(res.status).toBe(401);
    });

    it("a viewer cannot create an investigation", async () => {
      const token = await loginAs(app, "sam.whitfield@northwind.test");
      const res = await request(app)
        .post("/api/v1/investigations")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Test", description: "Test desc", leadAnalystId: "user_3" });
      expect(res.status).toBe(403);
    });
  });

  describe("list / getById", () => {
    it("lists the seeded investigation", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/investigations").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data[0].id).toBe("inv_1");
    });

    it("returns 404 for a nonexistent ID", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/investigations/does-not-exist").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it("IDOR guard: an outsider gets 404 for another org's investigation", async () => {
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Outsider",
        organization: "Some Other Company",
        email: "outsider-inv@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string;
      const res = await request(app).get("/api/v1/investigations/inv_1").set("Authorization", `Bearer ${outsiderToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("create", () => {
    it("creates an investigation with an opening timeline event attributed to the creator", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test"); // Diego Alvarez
      const res = await request(app)
        .post("/api/v1/investigations")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "New case", description: "Looking into it.", leadAnalystId: "user_4" });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("open");
      expect(res.body.data.leadAnalystId).toBe("user_4");
      expect(res.body.data.timeline).toHaveLength(1);
      expect(res.body.data.timeline[0]).toMatchObject({ title: "Investigation opened", actor: "Diego Alvarez" });
    });

    it("rejects a lead analyst from a different organization", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/investigations")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "New case", description: "Desc", leadAnalystId: "not-a-real-user" });
      expect(res.status).toBe(400);
    });
  });

  describe("updateStatus", () => {
    it("changes status and records who did it, not a client-supplied name", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .patch("/api/v1/investigations/inv_1/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "resolved", actorName: "Someone Else Entirely" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("resolved");
      const lastEvent = res.body.data.timeline.at(-1);
      expect(lastEvent.actor).toBe("Diego Alvarez");
      expect(lastEvent.title).toBe("Status changed");
    });
  });

  describe("addNote", () => {
    it("adds a regular note without an extra timeline event", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const before = await request(app).get("/api/v1/investigations/inv_1").set("Authorization", `Bearer ${token}`);
      const timelineLenBefore = before.body.data.timeline.length;

      const res = await request(app)
        .post("/api/v1/investigations/inv_1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Just a regular update.", isFinding: false });
      expect(res.status).toBe(201);
      expect(res.body.data.authorName).toBe("Diego Alvarez");
      expect(res.body.data.isFinding).toBe(false);

      const after = await request(app).get("/api/v1/investigations/inv_1").set("Authorization", `Bearer ${token}`);
      expect(after.body.data.timeline.length).toBe(timelineLenBefore);
    });

    it("adding a finding note also appends a 'Finding noted' timeline event", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/investigations/inv_1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "This is a key finding.", isFinding: true });
      expect(res.status).toBe(201);

      const after = await request(app).get("/api/v1/investigations/inv_1").set("Authorization", `Bearer ${token}`);
      const lastEvent = after.body.data.timeline.at(-1);
      expect(lastEvent).toMatchObject({ title: "Finding noted", description: "This is a key finding." });
    });
  });

  describe("link/unlink incident", () => {
    it("links a real incident from the same organization", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/investigations/inv_1/incidents")
        .set("Authorization", `Bearer ${token}`)
        .send({ incidentId: "inc_2" });
      expect(res.status).toBe(200);
      expect(res.body.data.relatedIncidentIds).toContain("inc_2");
    });

    it("rejects linking a nonexistent incident", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/investigations/inv_1/incidents")
        .set("Authorization", `Bearer ${token}`)
        .send({ incidentId: "does-not-exist" });
      expect(res.status).toBe(400);
    });

    it("unlinks a previously linked incident", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .delete("/api/v1/investigations/inv_1/incidents/inc_1")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.relatedIncidentIds).not.toContain("inc_1");
    });
  });

  describe("link/unlink indicator", () => {
    it("links a real indicator from the same organization", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/investigations/inv_1/indicators")
        .set("Authorization", `Bearer ${token}`)
        .send({ indicatorId: "ind_9" }); // not already linked to inv_1
      expect(res.status).toBe(200);
      expect(res.body.data.relatedIndicatorIds).toContain("ind_9");
      expect(res.body.data.timeline.at(-1)).toMatchObject({
        title: "Linked indicator",
        description: "44d88612fea8a8f36de82e1278abb02f", // the indicator's value, not its raw ID
      });
    });

    it("rejects linking a nonexistent indicator", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/investigations/inv_1/indicators")
        .set("Authorization", `Bearer ${token}`)
        .send({ indicatorId: "does-not-exist" });
      expect(res.status).toBe(400);
    });

    it("unlinks an indicator", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .delete("/api/v1/investigations/inv_1/indicators/ind_4")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.relatedIndicatorIds).not.toContain("ind_4");
    });
  });
});
