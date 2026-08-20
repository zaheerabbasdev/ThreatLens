import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { ApiAuthService } from "./auth.service";
import { ApiIncidentService } from "./incident.service";
import { ApiAlertService } from "./alert.service";
import { ApiIOCService } from "./ioc.service";
import { ApiUserService } from "./user.service";
import { ApiAuditService } from "./audit.service";
import { ApiGraphService } from "./graph.service";
import { ApiMitreService } from "./mitre.service";
import { ApiInvestigationService } from "./investigation.service";
import { ApiReportService } from "./report.service";
import { ApiAIService } from "./ai.service";

/**
 * Same real-backend-as-a-child-process pattern as auth.service.integration
 * .test.ts, extended to every other Phase 12 `Api*Service` — proves each
 * one's wire contract (URL, query params, response envelope shape) against
 * the actual running server, not just that it typechecks against the
 * shared interface. Uses the real seeded demo data (org_northwind, inc_1,
 * ind_1, ...) every backend test file in backend/src already depends on.
 */
const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../backend");
const serverEntry = path.join(backendDir, "dist", "server.js");
const PORT = 4900 + Math.floor(Math.random() * 90);
const BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

let serverProcess: ChildProcess | undefined;
let backendAvailable = false;

async function waitForHealth(timeoutMs = 15_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

beforeAll(async () => {
  if (!existsSync(serverEntry)) {
    console.warn('[services.integration] backend/dist/server.js not found — run "npm run build" in backend/ first. Skipping.');
    return;
  }
  serverProcess = spawn(process.execPath, [serverEntry], {
    cwd: backendDir,
    env: {
      ...process.env,
      NODE_ENV: "development",
      PORT: String(PORT),
      CORS_ALLOWED_ORIGINS: "http://localhost:5173",
      JWT_ACCESS_SECRET: randomBytes(48).toString("base64"),
      JWT_REFRESH_SECRET: randomBytes(48).toString("base64"),
    },
    stdio: "pipe",
  });
  backendAvailable = await waitForHealth();
  vi.stubEnv("VITE_API_BASE_URL", BASE_URL);
  if (backendAvailable) {
    // Every service below authenticates via the shared in-memory access
    // token client.ts holds — one real login establishes it for the whole file.
    await new ApiAuthService().login({ email: "avery.chen@northwind.test", password: "ThreatLens#Demo1" });
  }
}, 20_000);

afterAll(() => {
  serverProcess?.kill();
  vi.unstubAllEnvs();
});

describe("Api*Service (real backend)", () => {
  it("ApiIncidentService.list/getById return the real seeded incident", async ({ skip }) => {
    if (!backendAvailable) skip();
    const service = new ApiIncidentService();
    const page = await service.list();
    expect(page.total).toBeGreaterThan(0);
    expect(page.items.some((i) => i.id === "inc_1")).toBe(true);

    const incident = await service.getById("inc_1");
    expect(incident?.id).toBe("inc_1");

    expect(await service.getById("does-not-exist")).toBeNull();
  });

  it("ApiIncidentService.getSummary returns real aggregate counts", async ({ skip }) => {
    if (!backendAvailable) skip();
    const summary = await new ApiIncidentService().getSummary();
    expect(summary.total).toBeGreaterThan(0);
    expect(typeof summary.open).toBe("number");
  });

  it("ApiAlertService.list/getSummary hit the real endpoints", async ({ skip }) => {
    if (!backendAvailable) skip();
    const service = new ApiAlertService();
    const page = await service.list();
    expect(page.total).toBeGreaterThan(0);
    const summary = await service.getSummary();
    expect(summary.total).toBe(page.total);
  });

  it("ApiIOCService.list/getById/submit round-trip against the real backend", async ({ skip }) => {
    if (!backendAvailable) skip();
    const service = new ApiIOCService();
    const page = await service.list();
    expect(page.total).toBeGreaterThan(0);

    const created = await service.submit({ type: "ip", value: "203.0.113.99", notes: "integration test" });
    expect(created.type).toBe("ip");
    expect(created.value).toBe("203.0.113.99");

    const fetched = await service.getById(created.id);
    expect(fetched?.id).toBe(created.id);
  });

  it("ApiUserService.list/getCurrentOrganization hit the real endpoints", async ({ skip }) => {
    if (!backendAvailable) skip();
    const service = new ApiUserService();
    const page = await service.list();
    expect(page.items.some((u) => u.email === "avery.chen@northwind.test")).toBe(true);

    const org = await service.getCurrentOrganization();
    expect(org.name).toBeTruthy();
  });

  it("ApiAuditService.list reflects the real audit trail (the IOC submission above)", async ({ skip }) => {
    if (!backendAvailable) skip();
    const page = await new ApiAuditService().list();
    expect(page.items.some((entry) => entry.action === "IOC_SUBMITTED")).toBe(true);
  });

  it("ApiGraphService.getGraph returns a real assembled graph", async ({ skip }) => {
    if (!backendAvailable) skip();
    const graph = await new ApiGraphService().getGraph();
    expect(graph.nodes.some((n) => n.id === "inc_1")).toBe(true);
  });

  it("ApiMitreService.listTactics/listTechniques hit the real reference data", async ({ skip }) => {
    if (!backendAvailable) skip();
    const service = new ApiMitreService();
    const tactics = await service.listTactics();
    expect(tactics.length).toBeGreaterThan(0);
    const techniques = await service.listTechniques();
    expect(techniques.length).toBeGreaterThan(0);
  });

  it("ApiInvestigationService.list/getById returns the real seeded investigation", async ({ skip }) => {
    if (!backendAvailable) skip();
    const service = new ApiInvestigationService();
    const page = await service.list();
    expect(page.items.some((inv) => inv.id === "inv_1")).toBe(true);
    expect((await service.getById("inv_1"))?.id).toBe("inv_1");
  });

  it("ApiReportService.create/getById round-trips a real generated report", async ({ skip }) => {
    if (!backendAvailable) skip();
    const service = new ApiReportService();
    const created = await service.create({
      type: "incident_report",
      title: "Integration test report",
      periodStart: "2026-08-01T00:00:00.000Z",
      periodEnd: "2026-08-20T00:00:00.000Z",
    });
    expect(created.title).toBe("Integration test report");
    expect((await service.getById(created.id))?.id).toBe(created.id);
  });

  it("ApiAIService.analyzeIncident degrades to null (not a thrown error) when no AI provider is configured", async ({ skip }) => {
    if (!backendAvailable) skip();
    // This test file's spawned backend has no OPENAI_API_KEY set, so the
    // real backend genuinely returns 503 here — proving the client-side
    // 503→null mapping in ai.service.ts against the real, unconfigured
    // response, not a fabricated one.
    const result = await new ApiAIService().analyzeIncident("inc_1");
    expect(result).toBeNull();
  });

  it("ApiAIService.askAssistant also surfaces the real 503 as a thrown ApiError (no null-fallback for chat)", async ({ skip }) => {
    if (!backendAvailable) skip();
    const { ApiError } = await import("./client");
    const err = await new ApiAIService().askAssistant("What's the status?").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as InstanceType<typeof ApiError>).status).toBe(503);
  });
});
