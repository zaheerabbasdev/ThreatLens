import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";
import { InMemoryIncidentRepository } from "../repositories/incident.repository.js";
import { seedDemoIncidents } from "../repositories/incident.seed.js";
import { InMemoryReportRepository } from "../repositories/report.repository.js";
import { seedDemoReports } from "../repositories/report.seed.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";

async function buildApp() {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  const incidentRepository = new InMemoryIncidentRepository();
  seedDemoIncidents(incidentRepository);
  const reportRepository = new InMemoryReportRepository();
  seedDemoReports(reportRepository);
  return createApp({ userRepository, incidentRepository, reportRepository });
}

async function loginAs(app: Awaited<ReturnType<typeof buildApp>>, email: string): Promise<string> {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: DEMO_PASSWORD });
  return res.body.data.accessToken as string;
}

describe("reports", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe("authorization", () => {
    it("rejects an unauthenticated request", async () => {
      const res = await request(app).get("/api/v1/reports");
      expect(res.status).toBe(401);
    });

    it("every seeded role (all have reports:read) can list reports", async () => {
      const token = await loginAs(app, "sam.whitfield@northwind.test"); // viewer
      const res = await request(app).get("/api/v1/reports").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it("a viewer (lacks reports:generate) cannot create a report", async () => {
      const token = await loginAs(app, "sam.whitfield@northwind.test");
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: "incident_report",
          title: "Test",
          periodStart: "2026-08-01T00:00:00Z",
          periodEnd: "2026-08-15T00:00:00Z",
        });
      expect(res.status).toBe(403);
    });

    it("a security_analyst (has reports:generate) can create a report", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: "incident_report",
          title: "Test Report",
          periodStart: "2026-08-01T00:00:00Z",
          periodEnd: "2026-08-15T00:00:00Z",
        });
      expect(res.status).toBe(201);
    });
  });

  describe("list / getById", () => {
    it("lists the 5 seeded reports", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/reports").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(5);
    });

    it("filters by type", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/reports?type=risk_report").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe("report_3");
    });

    it("returns 404 for a nonexistent report", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/reports/does-not-exist").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it("IDOR guard: an outsider gets 404 for another org's report", async () => {
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Outsider",
        organization: "Some Other Company",
        email: "outsider-reports@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string;
      const res = await request(app).get("/api/v1/reports/report_1").set("Authorization", `Bearer ${outsiderToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("create — summary computed from real data", () => {
    it("incident_report: reflects the actual seeded incidents in the period, not a canned string", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: "incident_report",
          title: "Real Incident Report",
          periodStart: "2026-08-01T00:00:00Z",
          periodEnd: "2026-08-16T00:00:00Z",
        });
      expect(res.status).toBe(201);
      // 3 seeded incidents (inc_1 critical, inc_2 high, inc_3 high) all fall in this period.
      expect(res.body.data.summary).toContain("3 incidents recorded");
      expect(res.body.data.summary).toContain("1 critical");
      expect(res.body.data.generatedBy).toBe("Diego Alvarez"); // resolved server-side, not client-supplied
    });

    it("incident_report: reports zero incidents honestly for a period with none", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: "incident_report",
          title: "Empty Period",
          periodStart: "2020-01-01T00:00:00Z",
          periodEnd: "2020-01-02T00:00:00Z",
        });
      expect(res.status).toBe(201);
      expect(res.body.data.summary).toBe("No incidents were recorded in this period.");
    });

    it("risk_report: says plainly that risk scoring isn't available yet, rather than inventing a score", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: "risk_report",
          title: "Risk",
          periodStart: "2026-08-01T00:00:00Z",
          periodEnd: "2026-08-16T00:00:00Z",
        });
      expect(res.status).toBe(201);
      expect(res.body.data.summary).toMatch(/not available|isn't available/i);
      expect(res.body.data.summary).not.toMatch(/\d+\/100/); // no fabricated numeric score
    });

    it("activity_report: reflects real audit log activity in the period", async () => {
      // Generate at least one real audit event first (a login).
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const now = new Date().toISOString();
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: "activity_report",
          title: "Today's Activity",
          periodStart: "2026-01-01T00:00:00Z",
          periodEnd: now,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.summary).toMatch(/^\d+ audit events? recorded/);
    });
  });

  describe("input validation", () => {
    it("rejects periodEnd before periodStart", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/reports")
        .set("Authorization", `Bearer ${token}`)
        .send({
          type: "incident_report",
          title: "Backwards period",
          periodStart: "2026-08-15T00:00:00Z",
          periodEnd: "2026-08-01T00:00:00Z",
        });
      expect(res.status).toBe(422);
    });
  });
});
