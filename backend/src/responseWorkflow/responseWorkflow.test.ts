import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";
import { InMemoryIncidentRepository } from "../repositories/incident.repository.js";
import { seedDemoIncidents } from "../repositories/incident.seed.js";
import { InMemoryRecommendationRepository } from "../repositories/recommendation.repository.js";
import type { Recommendation } from "../types/ai.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";

async function buildApp() {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  const incidentRepository = new InMemoryIncidentRepository();
  seedDemoIncidents(incidentRepository);
  const recommendationRepository = new InMemoryRecommendationRepository();
  const app = createApp({ userRepository, incidentRepository, recommendationRepository });
  return { app, recommendationRepository };
}

async function loginAs(app: Awaited<ReturnType<typeof buildApp>>["app"], email: string): Promise<string> {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: DEMO_PASSWORD });
  return res.body.data.accessToken as string;
}

async function seedRecommendation(
  repo: InMemoryRecommendationRepository,
  overrides: Partial<Recommendation> = {},
): Promise<Recommendation> {
  return repo.create({
    id: overrides.id ?? "rec_test_1",
    organizationId: "org_northwind",
    incidentId: "inc_1",
    title: "Force password reset",
    description: "Reset passwords for the affected users.",
    status: "pending",
    generatedBy: "ai",
    ...overrides,
  });
}

describe("response-actions", () => {
  let ctx: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    ctx = await buildApp();
  });

  describe("authentication and authorization", () => {
    it("rejects an unauthenticated request", async () => {
      const res = await request(ctx.app).get("/api/v1/response-actions?incidentId=inc_1");
      expect(res.status).toBe(401);
    });

    it("a viewer (lacks response:request) cannot request an action", async () => {
      const token = await loginAs(ctx.app, "sam.whitfield@northwind.test");
      const res = await request(ctx.app)
        .post("/api/v1/response-actions")
        .set("Authorization", `Bearer ${token}`)
        .send({ incidentId: "inc_1", type: "block_ip", target: "1.2.3.4", description: "Block attacker IP" });
      expect(res.status).toBe(403);
    });

    it("a viewer (has incidents:read) can list actions for an incident", async () => {
      const token = await loginAs(ctx.app, "sam.whitfield@northwind.test");
      const res = await request(ctx.app).get("/api/v1/response-actions?incidentId=inc_1").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it("a security_analyst (has response:request) can request an action", async () => {
      const token = await loginAs(ctx.app, "diego.alvarez@northwind.test");
      const res = await request(ctx.app)
        .post("/api/v1/response-actions")
        .set("Authorization", `Bearer ${token}`)
        .send({ incidentId: "inc_1", type: "block_ip", target: "1.2.3.4", description: "Block attacker IP" });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("pending_execution");
    });

    it("a security_analyst (lacks response:execute) cannot execute an action", async () => {
      const token = await loginAs(ctx.app, "diego.alvarez@northwind.test");
      const created = await request(ctx.app)
        .post("/api/v1/response-actions")
        .set("Authorization", `Bearer ${token}`)
        .send({ incidentId: "inc_1", type: "block_ip", target: "1.2.3.4", description: "Block attacker IP" });
      const res = await request(ctx.app).post(`/api/v1/response-actions/${created.body.data.id}/execute`).set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("a security_admin (has response:execute) can execute an action", async () => {
      const analystToken = await loginAs(ctx.app, "diego.alvarez@northwind.test");
      const created = await request(ctx.app)
        .post("/api/v1/response-actions")
        .set("Authorization", `Bearer ${analystToken}`)
        .send({ incidentId: "inc_1", type: "block_ip", target: "1.2.3.4", description: "Block attacker IP" });

      const adminToken = await loginAs(ctx.app, "priya.n@northwind.test"); // security_admin
      const res = await request(ctx.app).post(`/api/v1/response-actions/${created.body.data.id}/execute`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("executed");
      expect(res.body.data.isSimulated).toBe(true);
      expect(res.body.data.executionResult).toBeTruthy();
    });
  });

  describe("request validation", () => {
    it("returns 404 for a nonexistent incident", async () => {
      const token = await loginAs(ctx.app, "diego.alvarez@northwind.test");
      const res = await request(ctx.app)
        .post("/api/v1/response-actions")
        .set("Authorization", `Bearer ${token}`)
        .send({ incidentId: "does-not-exist", type: "block_ip", target: "1.2.3.4", description: "Block" });
      expect(res.status).toBe(404);
    });

    it("rejects an invalid action type", async () => {
      const token = await loginAs(ctx.app, "diego.alvarez@northwind.test");
      const res = await request(ctx.app)
        .post("/api/v1/response-actions")
        .set("Authorization", `Bearer ${token}`)
        .send({ incidentId: "inc_1", type: "nuke_the_datacenter", target: "x", description: "Block" });
      expect(res.status).toBe(422);
    });

    it("rejects submitting the internal-only 'recommended_action' type directly", async () => {
      const token = await loginAs(ctx.app, "diego.alvarez@northwind.test");
      const res = await request(ctx.app)
        .post("/api/v1/response-actions")
        .set("Authorization", `Bearer ${token}`)
        .send({ incidentId: "inc_1", type: "recommended_action", target: "x", description: "Block" });
      expect(res.status).toBe(422);
    });

    it("IDOR guard: an outsider cannot request an action against another org's incident", async () => {
      const register = await request(ctx.app).post("/api/v1/auth/register").send({
        name: "Outsider",
        organization: "Some Other Company",
        email: "outsider-response@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string;
      const res = await request(ctx.app)
        .post("/api/v1/response-actions")
        .set("Authorization", `Bearer ${outsiderToken}`)
        .send({ incidentId: "inc_1", type: "block_ip", target: "1.2.3.4", description: "Block" });
      expect(res.status).toBe(404);
    });
  });

  describe("execute / reject state machine", () => {
    it("returns 409 executing an already-executed action", async () => {
      const analystToken = await loginAs(ctx.app, "diego.alvarez@northwind.test");
      const created = await request(ctx.app)
        .post("/api/v1/response-actions")
        .set("Authorization", `Bearer ${analystToken}`)
        .send({ incidentId: "inc_1", type: "isolate_host", target: "workstation-42", description: "Isolate" });

      const adminToken = await loginAs(ctx.app, "priya.n@northwind.test");
      await request(ctx.app).post(`/api/v1/response-actions/${created.body.data.id}/execute`).set("Authorization", `Bearer ${adminToken}`);
      const second = await request(ctx.app).post(`/api/v1/response-actions/${created.body.data.id}/execute`).set("Authorization", `Bearer ${adminToken}`);
      expect(second.status).toBe(409);
    });

    it("rejects a pending action instead of executing it", async () => {
      const analystToken = await loginAs(ctx.app, "diego.alvarez@northwind.test");
      const created = await request(ctx.app)
        .post("/api/v1/response-actions")
        .set("Authorization", `Bearer ${analystToken}`)
        .send({ incidentId: "inc_1", type: "disable_user_account", target: "jsmith", description: "Disable" });

      const adminToken = await loginAs(ctx.app, "priya.n@northwind.test");
      const res = await request(ctx.app).post(`/api/v1/response-actions/${created.body.data.id}/reject`).set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("rejected");
      expect(res.body.data.executionResult).toBeUndefined();
    });

    it("returns 404 executing a nonexistent action", async () => {
      const adminToken = await loginAs(ctx.app, "priya.n@northwind.test");
      const res = await request(ctx.app).post("/api/v1/response-actions/does-not-exist/execute").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("apply-recommendation", () => {
    it("returns 409 when the recommendation is still pending (not yet approved)", async () => {
      await seedRecommendation(ctx.recommendationRepository, { status: "pending" });
      const adminToken = await loginAs(ctx.app, "priya.n@northwind.test");
      const res = await request(ctx.app).post("/api/v1/response-actions/apply-recommendation/rec_test_1").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(409);
    });

    it("returns 409 when the recommendation was rejected", async () => {
      await seedRecommendation(ctx.recommendationRepository, { status: "rejected" });
      const adminToken = await loginAs(ctx.app, "priya.n@northwind.test");
      const res = await request(ctx.app).post("/api/v1/response-actions/apply-recommendation/rec_test_1").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(409);
    });

    it("applies an approved recommendation, executing it immediately and marking it applied", async () => {
      await seedRecommendation(ctx.recommendationRepository, { status: "approved" });
      const adminToken = await loginAs(ctx.app, "priya.n@northwind.test");
      const res = await request(ctx.app).post("/api/v1/response-actions/apply-recommendation/rec_test_1").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("executed");
      expect(res.body.data.recommendationId).toBe("rec_test_1");
      expect(res.body.data.type).toBe("recommended_action");

      const updated = await ctx.recommendationRepository.getById("org_northwind", "rec_test_1");
      expect(updated?.status).toBe("applied");
    });

    it("a security_analyst (lacks response:execute) cannot apply a recommendation", async () => {
      await seedRecommendation(ctx.recommendationRepository, { status: "approved" });
      const token = await loginAs(ctx.app, "diego.alvarez@northwind.test");
      const res = await request(ctx.app).post("/api/v1/response-actions/apply-recommendation/rec_test_1").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("returns 404 for a nonexistent recommendation", async () => {
      const adminToken = await loginAs(ctx.app, "priya.n@northwind.test");
      const res = await request(ctx.app).post("/api/v1/response-actions/apply-recommendation/does-not-exist").set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("audit trail", () => {
    it("records RESPONSE_ACTION_REQUESTED and RESPONSE_ACTION_EXECUTED under the real actors", async () => {
      const analystToken = await loginAs(ctx.app, "diego.alvarez@northwind.test");
      const created = await request(ctx.app)
        .post("/api/v1/response-actions")
        .set("Authorization", `Bearer ${analystToken}`)
        .send({ incidentId: "inc_1", type: "block_ip", target: "1.2.3.4", description: "Block attacker IP" });

      const adminToken = await loginAs(ctx.app, "priya.n@northwind.test");
      await request(ctx.app).post(`/api/v1/response-actions/${created.body.data.id}/execute`).set("Authorization", `Bearer ${adminToken}`);

      const audit = await request(ctx.app).get("/api/v1/audit-logs").set("Authorization", `Bearer ${adminToken}`);
      expect(audit.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: "RESPONSE_ACTION_REQUESTED", actorName: "Diego Alvarez", resourceId: created.body.data.id }),
          expect.objectContaining({ action: "RESPONSE_ACTION_EXECUTED", actorName: "Priya Natarajan", resourceId: created.body.data.id }),
        ]),
      );
    });
  });
});
