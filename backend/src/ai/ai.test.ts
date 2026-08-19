import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";
import { InMemoryIncidentRepository } from "../repositories/incident.repository.js";
import { seedDemoIncidents } from "../repositories/incident.seed.js";
import { InMemoryRecommendationRepository } from "../repositories/recommendation.repository.js";
import { InMemoryAIAnalysisRepository } from "../repositories/aiAnalysis.repository.js";
import { InMemoryAuditLogRepository } from "../repositories/auditLog.repository.js";
import type { AIProvider, AIResult, AnalyzeIncidentOutput, AnswerQuestionOutput, GenerateRecommendationsOutput } from "./aiProvider.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";

/** A fake AIProvider — real Zod-shaped output, zero network calls. Lets the HTTP layer (auth/permissions/caching/audit/human-in-the-loop) be tested independent of openaiProvider.ts, which already has its own dedicated unit tests. */
class FakeAIProvider implements AIProvider {
  readonly label = "fake-ai-provider";
  calls = 0;

  async answerQuestion(): Promise<AIResult<AnswerQuestionOutput>> {
    this.calls++;
    return { output: { answer: "This is a fake AI answer." }, tokensUsed: 10, durationMs: 1 };
  }

  async analyzeIncident(): Promise<AIResult<AnalyzeIncidentOutput>> {
    this.calls++;
    return {
      output: { summary: "Fake summary.", keyFindings: ["Fake finding 1"], suggestedMitreTechniqueIds: ["T1566"] },
      tokensUsed: 20,
      durationMs: 1,
    };
  }

  async generateRecommendations(): Promise<AIResult<GenerateRecommendationsOutput>> {
    this.calls++;
    return {
      output: { recommendations: [{ title: "Fake recommendation", description: "Do the fake thing." }] },
      tokensUsed: 15,
      durationMs: 1,
    };
  }
}

async function buildApp(aiProvider: AIProvider | null) {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  const incidentRepository = new InMemoryIncidentRepository();
  seedDemoIncidents(incidentRepository);
  const recommendationRepository = new InMemoryRecommendationRepository();
  const aiAnalysisRepository = new InMemoryAIAnalysisRepository();
  const auditLogRepository = new InMemoryAuditLogRepository();
  const app = createApp({
    userRepository,
    incidentRepository,
    recommendationRepository,
    aiAnalysisRepository,
    auditLogRepository,
    aiProvider: aiProvider ?? undefined,
  });
  return { app, auditLogRepository };
}

async function loginAs(app: Awaited<ReturnType<typeof buildApp>>["app"], email: string): Promise<string> {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: DEMO_PASSWORD });
  return res.body.data.accessToken as string;
}

describe("ai routes", () => {
  describe("when OPENAI_API_KEY is not configured (aiProvider is null)", () => {
    let app: Awaited<ReturnType<typeof buildApp>>["app"];

    beforeEach(async () => {
      ({ app } = await buildApp(null));
    });

    it("returns a clean 503, never fake content, for the assistant endpoint", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app)
        .post("/api/v1/ai/assistant")
        .set("Authorization", `Bearer ${token}`)
        .send({ message: "What is happening?" });
      expect(res.status).toBe(503);
      expect(res.body.data).toBeUndefined();
    });

    it("returns 503 for incident analysis", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/ai/incidents/inc_1/analysis").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(503);
    });

    it("returns 503 for generating recommendations", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app)
        .post("/api/v1/ai/incidents/inc_1/recommendations")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(503);
    });
  });

  describe("when configured (fake provider)", () => {
    let app: Awaited<ReturnType<typeof buildApp>>["app"];
    let auditLogRepository: Awaited<ReturnType<typeof buildApp>>["auditLogRepository"];
    let provider: FakeAIProvider;

    beforeEach(async () => {
      provider = new FakeAIProvider();
      ({ app, auditLogRepository } = await buildApp(provider));
    });

    describe("authentication", () => {
      it("rejects an unauthenticated assistant request", async () => {
        const res = await request(app).post("/api/v1/ai/assistant").send({ message: "hi" });
        expect(res.status).toBe(401);
      });
    });

    describe("POST /assistant", () => {
      it("answers a question with no incident context", async () => {
        const token = await loginAs(app, "avery.chen@northwind.test");
        const res = await request(app)
          .post("/api/v1/ai/assistant")
          .set("Authorization", `Bearer ${token}`)
          .send({ message: "What should I check first?" });
        expect(res.status).toBe(201);
        expect(res.body.data.role).toBe("assistant");
        expect(res.body.data.content).toBe("This is a fake AI answer.");
      });

      it("rejects an empty message (schema validation)", async () => {
        const token = await loginAs(app, "avery.chen@northwind.test");
        const res = await request(app)
          .post("/api/v1/ai/assistant")
          .set("Authorization", `Bearer ${token}`)
          .send({ message: "" });
        expect(res.status).toBe(422);
      });

      it("silently omits context for an incidentId belonging to another org rather than leaking or erroring", async () => {
        const register = await request(app).post("/api/v1/auth/register").send({
          name: "Outsider",
          organization: "Some Other Company",
          email: "outsider-ai@example.test",
          password: "Str0ng!Passw0rd#1",
        });
        const outsiderToken = register.body.data.accessToken as string;
        const res = await request(app)
          .post("/api/v1/ai/assistant")
          .set("Authorization", `Bearer ${outsiderToken}`)
          .send({ message: "Tell me about this incident", incidentId: "inc_1" });
        expect(res.status).toBe(201);
        expect(res.body.data.content).toBe("This is a fake AI answer.");
      });

      it("a viewer can ask the assistant (no incidents:write required)", async () => {
        const token = await loginAs(app, "sam.whitfield@northwind.test");
        const res = await request(app)
          .post("/api/v1/ai/assistant")
          .set("Authorization", `Bearer ${token}`)
          .send({ message: "hi" });
        expect(res.status).toBe(201);
      });
    });

    describe("GET /incidents/:id/analysis", () => {
      it("generates and returns an analysis, persisting it", async () => {
        const token = await loginAs(app, "diego.alvarez@northwind.test");
        const res = await request(app).get("/api/v1/ai/incidents/inc_1/analysis").set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.summary).toBe("Fake summary.");
        expect(res.body.data.disclaimer).toContain("assistive only");
        expect(res.body.data.modelLabel).toContain("fake-ai-provider");
      });

      it("caches the analysis: a second read does not call the provider again", async () => {
        const token = await loginAs(app, "diego.alvarez@northwind.test");
        await request(app).get("/api/v1/ai/incidents/inc_1/analysis").set("Authorization", `Bearer ${token}`);
        expect(provider.calls).toBe(1);
        await request(app).get("/api/v1/ai/incidents/inc_1/analysis").set("Authorization", `Bearer ${token}`);
        expect(provider.calls).toBe(1);
      });

      it("?regenerate=true forces a fresh provider call", async () => {
        const token = await loginAs(app, "diego.alvarez@northwind.test");
        await request(app).get("/api/v1/ai/incidents/inc_1/analysis").set("Authorization", `Bearer ${token}`);
        expect(provider.calls).toBe(1);
        await request(app)
          .get("/api/v1/ai/incidents/inc_1/analysis?regenerate=true")
          .set("Authorization", `Bearer ${token}`);
        expect(provider.calls).toBe(2);
      });

      it("404s for a nonexistent incident", async () => {
        const token = await loginAs(app, "diego.alvarez@northwind.test");
        const res = await request(app).get("/api/v1/ai/incidents/does-not-exist/analysis").set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(404);
      });

      it("IDOR guard: 404, not the analysis, for another org's incident", async () => {
        const register = await request(app).post("/api/v1/auth/register").send({
          name: "Outsider",
          organization: "Some Other Company",
          email: "outsider-ai-2@example.test",
          password: "Str0ng!Passw0rd#1",
        });
        const outsiderToken = register.body.data.accessToken as string;
        const res = await request(app).get("/api/v1/ai/incidents/inc_1/analysis").set("Authorization", `Bearer ${outsiderToken}`);
        expect(res.status).toBe(404);
      });

      it("records AI_ANALYSIS_REQUESTED and AI_ANALYSIS_COMPLETED audit events", async () => {
        const token = await loginAs(app, "diego.alvarez@northwind.test");
        await request(app).get("/api/v1/ai/incidents/inc_1/analysis").set("Authorization", `Bearer ${token}`);
        const logs = await auditLogRepository.list("org_northwind", {});
        const actions = logs.items.map((l) => l.action);
        expect(actions).toContain("AI_ANALYSIS_REQUESTED");
        expect(actions).toContain("AI_ANALYSIS_COMPLETED");
      });
    });

    describe("recommendations", () => {
      it("a viewer cannot generate recommendations (needs incidents:write)", async () => {
        const token = await loginAs(app, "sam.whitfield@northwind.test");
        const res = await request(app)
          .post("/api/v1/ai/incidents/inc_1/recommendations")
          .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(403);
      });

      it("an analyst generates recommendations, starting as pending", async () => {
        const token = await loginAs(app, "diego.alvarez@northwind.test");
        const res = await request(app)
          .post("/api/v1/ai/incidents/inc_1/recommendations")
          .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(201);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0]).toMatchObject({ title: "Fake recommendation", status: "pending", generatedBy: "ai" });
      });

      it("lists recommendations for an incident (incidents:read only)", async () => {
        const writeToken = await loginAs(app, "diego.alvarez@northwind.test");
        await request(app).post("/api/v1/ai/incidents/inc_1/recommendations").set("Authorization", `Bearer ${writeToken}`);

        const viewerToken = await loginAs(app, "sam.whitfield@northwind.test");
        const res = await request(app)
          .get("/api/v1/ai/incidents/inc_1/recommendations")
          .set("Authorization", `Bearer ${viewerToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
      });

      describe("human-in-the-loop review (spec §57/§58)", () => {
        it("a security_analyst CANNOT review/approve a recommendation", async () => {
          const analystToken = await loginAs(app, "diego.alvarez@northwind.test");
          const genRes = await request(app)
            .post("/api/v1/ai/incidents/inc_1/recommendations")
            .set("Authorization", `Bearer ${analystToken}`);
          const recId = genRes.body.data[0].id;

          const res = await request(app)
            .post(`/api/v1/ai/recommendations/${recId}/review`)
            .set("Authorization", `Bearer ${analystToken}`)
            .send({ status: "approved" });
          expect(res.status).toBe(403);
        });

        it("a viewer CANNOT review/approve a recommendation", async () => {
          const viewerToken = await loginAs(app, "sam.whitfield@northwind.test");
          const analystToken = await loginAs(app, "diego.alvarez@northwind.test");
          const genRes = await request(app)
            .post("/api/v1/ai/incidents/inc_1/recommendations")
            .set("Authorization", `Bearer ${analystToken}`);
          const recId = genRes.body.data[0].id;

          const res = await request(app)
            .post(`/api/v1/ai/recommendations/${recId}/review`)
            .set("Authorization", `Bearer ${viewerToken}`)
            .send({ status: "approved" });
          expect(res.status).toBe(403);
        });

        it("a security_admin CAN approve a recommendation, and it's audited under the reviewer's real identity", async () => {
          const analystToken = await loginAs(app, "diego.alvarez@northwind.test");
          const genRes = await request(app)
            .post("/api/v1/ai/incidents/inc_1/recommendations")
            .set("Authorization", `Bearer ${analystToken}`);
          const recId = genRes.body.data[0].id;

          const adminToken = await loginAs(app, "priya.n@northwind.test");
          const res = await request(app)
            .post(`/api/v1/ai/recommendations/${recId}/review`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: "approved" });
          expect(res.status).toBe(200);
          expect(res.body.data.status).toBe("approved");
          expect(res.body.data.reviewedBy).toBeTruthy();

          const logs = await auditLogRepository.list("org_northwind", {});
          const approvalEvent = logs.items.find((l) => l.action === "RECOMMENDATION_APPROVED");
          expect(approvalEvent).toBeDefined();
          expect(approvalEvent?.actorName).toBe("Priya Natarajan");
        });

        it("a super_admin CAN reject a recommendation", async () => {
          const analystToken = await loginAs(app, "diego.alvarez@northwind.test");
          const genRes = await request(app)
            .post("/api/v1/ai/incidents/inc_1/recommendations")
            .set("Authorization", `Bearer ${analystToken}`);
          const recId = genRes.body.data[0].id;

          const superAdminToken = await loginAs(app, "avery.chen@northwind.test");
          const res = await request(app)
            .post(`/api/v1/ai/recommendations/${recId}/review`)
            .set("Authorization", `Bearer ${superAdminToken}`)
            .send({ status: "rejected" });
          expect(res.status).toBe(200);
          expect(res.body.data.status).toBe("rejected");
        });

        it("rejects an invalid review status (schema-enforced enum)", async () => {
          const analystToken = await loginAs(app, "diego.alvarez@northwind.test");
          const genRes = await request(app)
            .post("/api/v1/ai/incidents/inc_1/recommendations")
            .set("Authorization", `Bearer ${analystToken}`);
          const recId = genRes.body.data[0].id;

          const adminToken = await loginAs(app, "priya.n@northwind.test");
          const res = await request(app)
            .post(`/api/v1/ai/recommendations/${recId}/review`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: "definitely-approved-trust-me" });
          expect(res.status).toBe(422);
        });

        it("404s reviewing a nonexistent recommendation", async () => {
          const adminToken = await loginAs(app, "priya.n@northwind.test");
          const res = await request(app)
            .post("/api/v1/ai/recommendations/does-not-exist/review")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ status: "approved" });
          expect(res.status).toBe(404);
        });
      });
    });
  });
});
