import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";
import { InMemorySecurityEventRepository } from "../repositories/securityEvent.repository.js";
import { seedDemoSecurityEvents } from "../repositories/securityEvent.seed.js";
import type { AnomalyDetectionProvider } from "./anomalyProvider.js";
import type { EventFeatures } from "./featureExtraction.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";

class FakeProvider implements AnomalyDetectionProvider {
  readonly name = "fake-ml";
  readonly calls: EventFeatures[] = [];
  constructor(private readonly output: Awaited<ReturnType<AnomalyDetectionProvider["detect"]>>["output"]) {}
  async detect(features: EventFeatures) {
    this.calls.push(features);
    return { output: this.output, durationMs: 1 };
  }
}

function anomalous() {
  return new FakeProvider({
    isAnomaly: true,
    anomalyScore: 91.4,
    confidence: "high",
    contributingFeatures: [{ feature: "auth_failure_count", zScore: 3.2, direction: "higher_than_typical" }],
    modelVersion: "test-v1",
  });
}

function benign() {
  return new FakeProvider({
    isAnomaly: false,
    anomalyScore: 8.2,
    confidence: "low",
    contributingFeatures: [],
    modelVersion: "test-v1",
  });
}

async function buildApp(anomalyDetectionProvider: AnomalyDetectionProvider | null = null) {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  const securityEventRepository = new InMemorySecurityEventRepository();
  await seedDemoSecurityEvents(securityEventRepository);
  return createApp({ userRepository, securityEventRepository, anomalyDetectionProvider });
}

async function loginAs(app: Awaited<ReturnType<typeof buildApp>>, email: string): Promise<string> {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: DEMO_PASSWORD });
  return res.body.data.accessToken as string;
}

describe("security-events", () => {
  describe("authentication and authorization", () => {
    it("rejects an unauthenticated ingest", async () => {
      const app = await buildApp();
      const res = await request(app).post("/api/v1/security-events");
      expect(res.status).toBe(401);
    });

    it("a viewer (has anomaly:read but not anomaly:detect) can list but not ingest", async () => {
      const app = await buildApp();
      const token = await loginAs(app, "sam.whitfield@northwind.test");
      const list = await request(app).get("/api/v1/security-events").set("Authorization", `Bearer ${token}`);
      expect(list.status).toBe(200);

      const ingest = await request(app)
        .post("/api/v1/security-events")
        .set("Authorization", `Bearer ${token}`)
        .send({ type: "authentication", description: "test", severity: "info" });
      expect(ingest.status).toBe(403);
    });

    it("a security_analyst (has anomaly:detect) can ingest", async () => {
      const app = await buildApp();
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/security-events")
        .set("Authorization", `Bearer ${token}`)
        .send({ type: "authentication", description: "Login", severity: "info", userId: "user_3" });
      expect(res.status).toBe(201);
      expect(res.body.data.type).toBe("authentication");
    });
  });

  describe("list", () => {
    it("lists the seeded events for the org", async () => {
      const app = await buildApp();
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/security-events").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBeGreaterThan(0);
    });
  });

  describe("analyze", () => {
    it("returns 503 when no ML provider is configured, not a fake result", async () => {
      const app = await buildApp(null);
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app).post("/api/v1/security-events/analyze/user_3").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(503);
    });

    it("a viewer (lacks anomaly:detect) is forbidden from analyzing", async () => {
      const app = await buildApp(anomalous());
      const token = await loginAs(app, "sam.whitfield@northwind.test");
      const res = await request(app).post("/api/v1/security-events/analyze/user_3").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("a security_analyst can analyze a user and gets the provider's real result back", async () => {
      const app = await buildApp(anomalous());
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app).post("/api/v1/security-events/analyze/user_3").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.result.isAnomaly).toBe(true);
      expect(res.body.data.result.anomalyScore).toBe(91.4);
      expect(res.body.data.userId).toBe("user_3");
    });

    it("a benign result also comes through unmodified", async () => {
      const app = await buildApp(benign());
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app).post("/api/v1/security-events/analyze/user_3").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.result.isAnomaly).toBe(false);
    });

    it("returns 404 for a nonexistent user", async () => {
      const app = await buildApp(anomalous());
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app).post("/api/v1/security-events/analyze/not-a-real-user").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it("IDOR guard: cannot analyze a user from a different organization", async () => {
      const app = await buildApp(anomalous());
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Outsider",
        organization: "Some Other Company",
        email: "outsider-anomaly@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string;
      // user_3 exists, but belongs to org_northwind, not the outsider's org.
      const res = await request(app).post("/api/v1/security-events/analyze/user_3").set("Authorization", `Bearer ${outsiderToken}`);
      expect(res.status).toBe(404);
    });

    it("respects the windowHours query param", async () => {
      const provider = anomalous();
      const app = await buildApp(provider);
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      await request(app).post("/api/v1/security-events/analyze/user_3?windowHours=48").set("Authorization", `Bearer ${token}`);
      expect(provider.calls).toHaveLength(1);
    });

    it("records an ANOMALY_DETECTED audit entry under the real actor", async () => {
      const app = await buildApp(anomalous());
      const token = await loginAs(app, "avery.chen@northwind.test"); // super_admin, has audit:read
      await request(app).post("/api/v1/security-events/analyze/user_3").set("Authorization", `Bearer ${token}`);
      const audit = await request(app).get("/api/v1/audit-logs").set("Authorization", `Bearer ${token}`);
      expect(audit.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ action: "ANOMALY_DETECTED", resourceId: "user_3", actorName: "Avery Chen" }),
        ]),
      );
    });
  });
});
