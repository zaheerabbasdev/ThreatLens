import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";
import { InMemoryIncidentRepository } from "../repositories/incident.repository.js";
import { seedDemoIncidents } from "../repositories/incident.seed.js";
import { InMemoryAuditLogRepository } from "../repositories/auditLog.repository.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";

async function buildApp() {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  const incidentRepository = new InMemoryIncidentRepository();
  seedDemoIncidents(incidentRepository);
  const auditLogRepository = new InMemoryAuditLogRepository();
  return createApp({ userRepository, incidentRepository, auditLogRepository });
}

async function loginAs(app: Awaited<ReturnType<typeof buildApp>>, email: string): Promise<string> {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: DEMO_PASSWORD });
  return res.body.data.accessToken as string;
}

describe("audit logs", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe("authorization", () => {
    it("rejects an unauthenticated request", async () => {
      const res = await request(app).get("/api/v1/audit-logs");
      expect(res.status).toBe(401);
    });

    it("every seeded role (all have audit:read) can read audit logs", async () => {
      const token = await loginAs(app, "sam.whitfield@northwind.test"); // viewer
      const res = await request(app).get("/api/v1/audit-logs").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });

  describe("automatic recording from real actions", () => {
    it("a successful login is recorded with the correct actor, action, and result", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app)
        .get("/api/v1/audit-logs?action=LOGIN")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toMatchObject({
        actorId: "user_1",
        actorName: "Avery Chen",
        action: "LOGIN",
        result: "success",
      });
    });

    it("a failed login (wrong password for a real account) is recorded", async () => {
      await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "avery.chen@northwind.test", password: "wrong-password-entirely" });

      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app)
        .get("/api/v1/audit-logs?action=LOGIN_FAILED")
        .set("Authorization", `Bearer ${token}`);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].result).toBe("failure");
    });

    it("every audit record carries the request ID and IP from the request that produced it", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app)
        .get("/api/v1/audit-logs?action=LOGIN")
        .set("Authorization", `Bearer ${token}`);
      const record = res.body.data[0];
      expect(typeof record.requestId).toBe("string");
      expect(record.requestId).not.toBe("unknown");
      expect(typeof record.ipAddress).toBe("string");
    });

    it("changing an incident's status is recorded as INCIDENT_UPDATED, attributed to the real actor", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      await request(app)
        .patch("/api/v1/incidents/inc_1/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "resolved" });

      const res = await request(app)
        .get("/api/v1/audit-logs?action=INCIDENT_UPDATED")
        .set("Authorization", `Bearer ${token}`);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        actorId: "user_3",
        actorName: "Diego Alvarez",
        resourceType: "incident",
        resourceId: "inc_1",
      });
    });

    it("registering a new account is recorded as USER_CREATED, scoped to the new organization", async () => {
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "New Admin",
        organization: "New Org",
        email: "new-admin@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const token = register.body.data.accessToken as string;

      const res = await request(app)
        .get("/api/v1/audit-logs?action=USER_CREATED")
        .set("Authorization", `Bearer ${token}`);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].actorName).toBe("New Admin");
    });
  });

  describe("tenant isolation", () => {
    it("an outsider's audit log view never includes another org's records", async () => {
      // Generate some org_northwind activity first.
      await loginAs(app, "avery.chen@northwind.test");

      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Outsider",
        organization: "Some Other Company",
        email: "outsider-audit@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string;

      const res = await request(app).get("/api/v1/audit-logs").set("Authorization", `Bearer ${outsiderToken}`);
      expect(res.status).toBe(200);
      // Only this outsider's own USER_CREATED event — nothing from org_northwind.
      expect(res.body.data.every((l: { organizationId: string }) => l.organizationId !== "org_northwind")).toBe(true);
    });
  });

  describe("filtering", () => {
    it("filters by result", async () => {
      await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "avery.chen@northwind.test", password: "wrong-password" });
      const token = await loginAs(app, "avery.chen@northwind.test");

      const res = await request(app).get("/api/v1/audit-logs?result=failure").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.every((l: { result: string }) => l.result === "failure")).toBe(true);
    });
  });
});
