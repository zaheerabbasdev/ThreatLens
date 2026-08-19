import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";
import { InMemoryIndicatorRepository } from "../repositories/indicator.repository.js";
import { seedDemoIndicators } from "../repositories/indicator.seed.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";

async function buildApp() {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  const indicatorRepository = new InMemoryIndicatorRepository();
  seedDemoIndicators(indicatorRepository);
  return createApp({ userRepository, indicatorRepository });
}

async function loginAs(app: Awaited<ReturnType<typeof buildApp>>, email: string): Promise<string> {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: DEMO_PASSWORD });
  return res.body.data.accessToken as string;
}

describe("ioc", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe("authentication and authorization", () => {
    it("rejects an unauthenticated request", async () => {
      const res = await request(app).get("/api/v1/ioc");
      expect(res.status).toBe(401);
    });

    it("a viewer (has ioc:read but not ioc:submit) can list but not submit", async () => {
      const token = await loginAs(app, "sam.whitfield@northwind.test");
      const list = await request(app).get("/api/v1/ioc").set("Authorization", `Bearer ${token}`);
      expect(list.status).toBe(200);

      const submit = await request(app)
        .post("/api/v1/ioc")
        .set("Authorization", `Bearer ${token}`)
        .send({ type: "ip", value: "8.8.8.8" });
      expect(submit.status).toBe(403);
    });

    it("a security_analyst (has ioc:submit) can submit", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/ioc")
        .set("Authorization", `Bearer ${token}`)
        .send({ type: "ip", value: "8.8.8.8" });
      expect(res.status).toBe(201);
    });
  });

  describe("submit — format validation per type", () => {
    it.each([
      ["ip", "203.0.113.5", true],
      ["ip", "not-an-ip", false],
      ["ip", "2001:db8::1", true],
      ["domain", "evil-example.test", true],
      ["domain", "not a domain!", false],
      ["url", "https://evil-example.test/path", true],
      ["url", "javascript:alert(1)", false],
      ["hash", "d41d8cd98f00b204e9800998ecf8427e", true], // 32 hex chars
      ["hash", "not-hex-and-wrong-length", false],
    ] as const)("type=%s value=%s → valid=%s", async (type, value, valid) => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/ioc")
        .set("Authorization", `Bearer ${token}`)
        .send({ type, value });
      expect(res.status).toBe(valid ? 201 : 422);
    });

    it("derives the correct hash algorithm from length", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const sha256 = "a".repeat(64);
      const res = await request(app)
        .post("/api/v1/ioc")
        .set("Authorization", `Bearer ${token}`)
        .send({ type: "hash", value: sha256 });
      expect(res.status).toBe(201);
      expect(res.body.data.algorithm).toBe("sha256");
    });

    it("a freshly submitted indicator starts unenriched (info/unverified/riskScore 0)", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/ioc")
        .set("Authorization", `Bearer ${token}`)
        .send({ type: "domain", value: "brand-new-domain.test" });
      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ severity: "info", confidence: "unverified", riskScore: 0 });
      expect(res.body.data.submittedBy).toBeDefined();
    });

    it("derives domain/path for a submitted URL", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .post("/api/v1/ioc")
        .set("Authorization", `Bearer ${token}`)
        .send({ type: "url", value: "https://evil-example.test/phish/login" });
      expect(res.status).toBe(201);
      expect(res.body.data.domain).toBe("evil-example.test");
      expect(res.body.data.path).toBe("/phish/login");
    });
  });

  describe("list / getById", () => {
    it("lists the seeded indicators", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/ioc").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(6);
    });

    it("filters by type", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/ioc?type=hash").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.every((i: { type: string }) => i.type === "hash")).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it("returns the indicator for a valid ID", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/ioc/ind_1").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.value).toBe("185.220.101.47");
    });

    it("IDOR guard: an outsider gets 404 for another org's indicator", async () => {
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Outsider",
        organization: "Some Other Company",
        email: "outsider-ioc@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string;
      const res = await request(app).get("/api/v1/ioc/ind_1").set("Authorization", `Bearer ${outsiderToken}`);
      expect(res.status).toBe(404);
    });
  });
});
