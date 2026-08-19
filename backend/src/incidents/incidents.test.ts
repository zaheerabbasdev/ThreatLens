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
  return createApp({ userRepository, incidentRepository });
}

async function loginAs(app: Awaited<ReturnType<typeof buildApp>>, email: string): Promise<string> {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: DEMO_PASSWORD });
  return res.body.data.accessToken as string;
}

describe("incidents", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe("authentication and authorization", () => {
    it("rejects an unauthenticated request", async () => {
      const res = await request(app).get("/api/v1/incidents");
      expect(res.status).toBe(401);
    });

    it("every seeded role can read the list (all roles have incidents:read)", async () => {
      for (const email of [
        "avery.chen@northwind.test",
        "priya.n@northwind.test",
        "diego.alvarez@northwind.test",
        "sam.whitfield@northwind.test",
      ]) {
        const token = await loginAs(app, email);
        const res = await request(app).get("/api/v1/incidents").set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
      }
    });

    it("a viewer (read-only role) cannot change an incident's status", async () => {
      const token = await loginAs(app, "sam.whitfield@northwind.test");
      const res = await request(app)
        .patch("/api/v1/incidents/inc_1/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "resolved" });
      expect(res.status).toBe(403);
    });

    it("a security_analyst (has incidents:write) can change an incident's status", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .patch("/api/v1/incidents/inc_1/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "resolved" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("resolved");
    });
  });

  describe("list", () => {
    it("returns paginated results with a meta envelope", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/incidents").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toMatchObject({ total: 3, page: 1, pageSize: 20 });
    });

    it("filters by severity", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app)
        .get("/api/v1/incidents?severity=critical")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.every((i: { severity: string }) => i.severity === "critical")).toBe(true);
    });

    it("filters by title search", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/incidents?search=brute-force").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe("inc_3");
    });

    it("rejects a pageSize above the cap", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/incidents?pageSize=500").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(422);
    });
  });

  describe("getSummary", () => {
    it("returns totals broken down by severity", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/incidents/summary").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.bySeverity.critical).toBe(1);
    });
  });

  describe("getById", () => {
    it("returns the incident for a valid ID", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/incidents/inc_1").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.title).toContain("phishing");
    });

    it("returns 404 for a nonexistent ID", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/incidents/does-not-exist").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it("IDOR guard: a user from a different organization gets 404, not the other org's incident", async () => {
      // register() creates a brand-new organization for this user.
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Outsider",
        organization: "Some Other Company",
        email: "outsider@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string;

      const res = await request(app)
        .get("/api/v1/incidents/inc_1") // belongs to org_northwind, not the outsider's new org
        .set("Authorization", `Bearer ${outsiderToken}`);

      expect(res.status).toBe(404);
      // Specifically NOT 403 — a 403 would confirm the resource exists
      // somewhere, which is exactly the information an IDOR guard must not leak.
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("IDOR guard: an outsider's own (empty) incident list never includes another org's incidents", async () => {
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Outsider",
        organization: "Some Other Company",
        email: "outsider2@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string;

      const res = await request(app).get("/api/v1/incidents").set("Authorization", `Bearer ${outsiderToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });
  });

  describe("assign", () => {
    it("assigns to a valid analyst in the same organization", async () => {
      const token = await loginAs(app, "priya.n@northwind.test"); // security_admin has incidents:assign
      const res = await request(app)
        .patch("/api/v1/incidents/inc_1/assign")
        .set("Authorization", `Bearer ${token}`)
        .send({ analystId: "user_4" });
      expect(res.status).toBe(200);
      expect(res.body.data.assignedAnalystId).toBe("user_4");
    });

    it("rejects assigning to a user outside the caller's organization", async () => {
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Outsider Admin",
        organization: "Some Other Company",
        email: "outsider-admin@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      // register() grants security_admin, which has incidents:assign — but
      // the outsider has no incidents of their own to assign, so this
      // proves the cross-org guard fires on the assignee, independent of
      // whether the incident itself is reachable.
      const outsiderToken = register.body.data.accessToken as string;
      const res = await request(app)
        .patch("/api/v1/incidents/inc_1/assign")
        .set("Authorization", `Bearer ${outsiderToken}`)
        .send({ analystId: "user_4" });
      // inc_1 isn't in this org either, so this is 404 — the object-level
      // check on the incident itself runs first.
      expect(res.status).toBe(404);
    });

    it("rejects assigning a valid incident to a nonexistent/foreign analystId", async () => {
      const token = await loginAs(app, "priya.n@northwind.test");
      const res = await request(app)
        .patch("/api/v1/incidents/inc_1/assign") // a real incident in this org
        .set("Authorization", `Bearer ${token}`)
        .send({ analystId: "not-a-real-user-id" });
      expect(res.status).toBe(400);
    });

    it("clears the assignee when analystId is null", async () => {
      const token = await loginAs(app, "priya.n@northwind.test");
      const res = await request(app)
        .patch("/api/v1/incidents/inc_1/assign")
        .set("Authorization", `Bearer ${token}`)
        .send({ analystId: null });
      expect(res.status).toBe(200);
      expect(res.body.data.assignedAnalystId).toBeUndefined();
    });
  });

  describe("addNote", () => {
    it("adds a note with the author resolved server-side, not from the request body", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/incidents/inc_1/notes")
        .set("Authorization", `Bearer ${token}`)
        // authorName here is a spoofing attempt — it must be ignored.
        .send({ content: "Confirmed MFA was not bypassed.", authorName: "Someone Else Entirely" });
      expect(res.status).toBe(201);
      expect(res.body.data.authorName).toBe("Diego Alvarez");
      expect(res.body.data.authorId).toBe("user_3");
      expect(res.body.data.content).toBe("Confirmed MFA was not bypassed.");
    });

    it("rejects an empty note", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/incidents/inc_1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "" });
      expect(res.status).toBe(422);
    });

    it("a viewer cannot add a note", async () => {
      const token = await loginAs(app, "sam.whitfield@northwind.test");
      const res = await request(app)
        .post("/api/v1/incidents/inc_1/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Trying anyway." });
      expect(res.status).toBe(403);
    });
  });
});
