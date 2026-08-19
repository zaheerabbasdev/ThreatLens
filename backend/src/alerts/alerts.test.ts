import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";
import { InMemoryAlertRepository } from "../repositories/alert.repository.js";
import { seedDemoAlerts } from "../repositories/alert.seed.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";

async function buildApp() {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  const alertRepository = new InMemoryAlertRepository();
  seedDemoAlerts(alertRepository);
  return createApp({ userRepository, alertRepository });
}

async function loginAs(app: Awaited<ReturnType<typeof buildApp>>, email: string): Promise<string> {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: DEMO_PASSWORD });
  return res.body.data.accessToken as string;
}

describe("alerts", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe("authentication and authorization", () => {
    it("rejects an unauthenticated request", async () => {
      const res = await request(app).get("/api/v1/alerts");
      expect(res.status).toBe(401);
    });

    it("every seeded role can read the list (all roles have alerts:read)", async () => {
      for (const email of [
        "avery.chen@northwind.test",
        "sam.whitfield@northwind.test", // viewer
      ]) {
        const token = await loginAs(app, email);
        const res = await request(app).get("/api/v1/alerts").set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
      }
    });

    it("a viewer cannot change an alert's status", async () => {
      const token = await loginAs(app, "sam.whitfield@northwind.test");
      const res = await request(app)
        .patch("/api/v1/alerts/alert_5/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "resolved" });
      expect(res.status).toBe(403);
    });

    it("a security_analyst (has alerts:write) can change an alert's status", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .patch("/api/v1/alerts/alert_5/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "resolved" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("resolved");
    });
  });

  describe("list", () => {
    it("returns paginated results with a meta envelope", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/alerts").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.meta).toMatchObject({ total: 8, page: 1, pageSize: 20 });
    });

    it("filters by status", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/alerts?status=open").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.every((a: { status: string }) => a.status === "open")).toBe(true);
      expect(res.body.data).toHaveLength(3);
    });

    it("filters by title search", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/alerts?search=TLS").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe("alert_8");
    });
  });

  describe("getSummary", () => {
    it("returns totals and an unresolved count", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/alerts/summary").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(8);
      // open (3) + investigating (2) per the seed data.
      expect(res.body.data.unresolved).toBe(5);
    });
  });

  describe("getById", () => {
    it("returns the alert for a valid ID", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/alerts/alert_1").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.title).toContain("MFA");
    });

    it("returns 404 for a nonexistent ID", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/alerts/does-not-exist").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it("IDOR guard: a user from a different organization gets 404, not the other org's alert", async () => {
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Outsider",
        organization: "Some Other Company",
        email: "outsider-alerts@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string;

      const res = await request(app).get("/api/v1/alerts/alert_1").set("Authorization", `Bearer ${outsiderToken}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("updateStatus", () => {
    it("returns 404 rather than updating an alert in another organization", async () => {
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Outsider Admin",
        organization: "Some Other Company",
        email: "outsider-admin-alerts@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string; // security_admin, has alerts:write
      const res = await request(app)
        .patch("/api/v1/alerts/alert_1/status")
        .set("Authorization", `Bearer ${outsiderToken}`)
        .send({ status: "resolved" });
      expect(res.status).toBe(404);
    });

    it("rejects an invalid status value", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .patch("/api/v1/alerts/alert_1/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "not-a-real-status" });
      expect(res.status).toBe(422);
    });
  });
});
