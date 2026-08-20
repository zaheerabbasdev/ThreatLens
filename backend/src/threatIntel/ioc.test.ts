import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";
import { InMemoryIndicatorRepository } from "../repositories/indicator.repository.js";
import { seedDemoIndicators } from "../repositories/indicator.seed.js";
import type { ThreatIntelProvider, ThreatIntelLookupInput } from "./threatIntelProvider.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";

/** A fake ThreatIntelProvider for HTTP-level tests — no network, no real VirusTotal. Records every call it receives so tests can assert on inputs. */
class FakeProvider implements ThreatIntelProvider {
  readonly name: string;
  readonly calls: ThreatIntelLookupInput[] = [];
  constructor(
    name: string,
    private readonly response: () => ReturnType<ThreatIntelProvider["lookup"]>,
  ) {
    this.name = name;
  }
  async lookup(input: ThreatIntelLookupInput) {
    this.calls.push(input);
    return this.response();
  }
}

function malicious(name = "fake-vt", score = 90) {
  return new FakeProvider(name, async () => ({
    output: { verdict: "malicious", score, confidence: "high", categories: ["trojan"] },
    durationMs: 5,
  }));
}

function failing(name = "fake-broken") {
  return new FakeProvider(name, async () => {
    throw new Error("simulated provider outage");
  });
}

async function buildApp(threatIntelProviders: ThreatIntelProvider[] = []) {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  const indicatorRepository = new InMemoryIndicatorRepository();
  seedDemoIndicators(indicatorRepository);
  return createApp({ userRepository, indicatorRepository, threatIntelProviders });
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

  describe("enrich", () => {
    it("returns 503 when no provider is configured, not a fake result (spec §40/§52-style honesty)", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test"); // no providers wired in `app`
      const res = await request(app).post("/api/v1/ioc/ind_1/enrich").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(503);
    });

    it("a viewer (lacks ioc:enrich) is forbidden", async () => {
      const providerApp = await buildApp([malicious()]);
      const token = await loginAs(providerApp, "sam.whitfield@northwind.test");
      const res = await request(providerApp).post("/api/v1/ioc/ind_1/enrich").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("a security_analyst (has ioc:enrich) can trigger enrichment and it updates the indicator deterministically", async () => {
      const providerApp = await buildApp([malicious("fake-vt", 95)]);
      const token = await loginAs(providerApp, "diego.alvarez@northwind.test");

      // ind_3 seeds at riskScore 74/high — a 95 from the provider should win
      // (conservative max aggregation) and push it to critical.
      const res = await request(providerApp).post("/api/v1/ioc/ind_3/enrich").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.riskScore).toBe(95);
      expect(res.body.data.severity).toBe("critical");
      expect(res.body.data.sources).toEqual(
        expect.arrayContaining([expect.objectContaining({ provider: "fake-vt", confidence: "high" })]),
      );
      // The original source is never discarded — disagreement stays visible.
      expect(res.body.data.sources).toEqual(
        expect.arrayContaining([expect.objectContaining({ provider: "Network IDS" })]),
      );
    });

    it("does not lower riskScore when a provider reports something less severe than an existing source", async () => {
      const clean = new FakeProvider("fake-clean", async () => ({
        output: { verdict: "clean", score: 5, confidence: "high", categories: [] },
        durationMs: 1,
      }));
      const providerApp = await buildApp([clean]);
      const token = await loginAs(providerApp, "diego.alvarez@northwind.test");

      // ind_1 seeds at riskScore 91 — a "clean" 5 from a new provider must
      // not silently launder that down.
      const res = await request(providerApp).post("/api/v1/ioc/ind_1/enrich").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.riskScore).toBe(91);
    });

    it("returns 404 for a nonexistent indicator", async () => {
      const providerApp = await buildApp([malicious()]);
      const token = await loginAs(providerApp, "diego.alvarez@northwind.test");
      const res = await request(providerApp).post("/api/v1/ioc/does-not-exist/enrich").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it("IDOR guard: an outsider cannot enrich another org's indicator", async () => {
      const providerApp = await buildApp([malicious()]);
      const register = await request(providerApp).post("/api/v1/auth/register").send({
        name: "Outsider",
        organization: "Some Other Company",
        email: "outsider-enrich@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string;
      const res = await request(providerApp).post("/api/v1/ioc/ind_1/enrich").set("Authorization", `Bearer ${outsiderToken}`);
      expect(res.status).toBe(404);
    });

    it("skips a provider queried recently and leaves the indicator unchanged, unless forced", async () => {
      const provider = malicious("fake-vt", 95);
      const providerApp = await buildApp([provider]);
      const token = await loginAs(providerApp, "diego.alvarez@northwind.test");

      const first = await request(providerApp).post("/api/v1/ioc/ind_3/enrich").set("Authorization", `Bearer ${token}`);
      expect(first.status).toBe(200);
      expect(provider.calls).toHaveLength(1);

      // Same provider, same indicator, immediately again — should be
      // skipped as "still fresh" rather than re-queried.
      const second = await request(providerApp).post("/api/v1/ioc/ind_3/enrich").set("Authorization", `Bearer ${token}`);
      expect(second.status).toBe(200);
      expect(provider.calls).toHaveLength(1); // unchanged — not called again

      const forced = await request(providerApp)
        .post("/api/v1/ioc/ind_3/enrich?force=true")
        .set("Authorization", `Bearer ${token}`);
      expect(forced.status).toBe(200);
      expect(provider.calls).toHaveLength(2); // force bypasses the staleness cache
    });

    it("a provider that throws is skipped, and the indicator still updates from the ones that succeeded", async () => {
      const providerApp = await buildApp([malicious("fake-vt", 90), failing()]);
      const token = await loginAs(providerApp, "diego.alvarez@northwind.test");
      const res = await request(providerApp).post("/api/v1/ioc/ind_3/enrich").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.riskScore).toBe(90);
      expect(res.body.data.sources.some((s: { provider: string }) => s.provider === "fake-vt")).toBe(true);
      expect(res.body.data.sources.some((s: { provider: string }) => s.provider === "fake-broken")).toBe(false);
    });

    it("returns the indicator unchanged (200, not an error) when every configured provider fails", async () => {
      const providerApp = await buildApp([failing()]);
      const token = await loginAs(providerApp, "diego.alvarez@northwind.test");
      const before = await request(providerApp).get("/api/v1/ioc/ind_1").set("Authorization", `Bearer ${token}`);
      const res = await request(providerApp).post("/api/v1/ioc/ind_1/enrich").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.riskScore).toBe(before.body.data.riskScore);
    });

    it("records an audit entry for a successful enrichment", async () => {
      const providerApp = await buildApp([malicious()]);
      const token = await loginAs(providerApp, "avery.chen@northwind.test"); // super_admin, also has audit:read
      await request(providerApp).post("/api/v1/ioc/ind_3/enrich").set("Authorization", `Bearer ${token}`);
      const audit = await request(providerApp).get("/api/v1/audit-logs").set("Authorization", `Bearer ${token}`);
      expect(audit.body.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ action: "IOC_ANALYZED", resourceId: "ind_3" })]),
      );
    });
  });
});
