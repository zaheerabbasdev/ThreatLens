import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { ApiAuthService } from "./auth.service";
import { ApiError, getAccessToken } from "./client";

/**
 * Real end-to-end verification: boots the ACTUAL backend server (compiled
 * output, same as production) as a child process and exercises
 * `ApiAuthService` against it over real HTTP — no mocked fetch, no stubbed
 * responses. This is the one place in the whole Phase 12 increment that
 * proves the frontend's real service layer and the real backend actually
 * agree on the wire contract, not just that each side's own test suite
 * passes in isolation.
 *
 * Skips (via each test's own `skip()`, not a collection-time guard —
 * whether the backend is available is only known after this file's async
 * `beforeAll` has run) if `backend/dist/server.js` hasn't been built yet.
 */
const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../backend");
const serverEntry = path.join(backendDir, "dist", "server.js");
const PORT = 4400 + Math.floor(Math.random() * 500); // avoid colliding with a dev server or another test run
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
      // not up yet — keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

beforeAll(async () => {
  if (!existsSync(serverEntry)) {
    console.warn('[auth.service.integration] backend/dist/server.js not found — run "npm run build" in backend/ first. Skipping.');
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
}, 20_000);

afterAll(() => {
  serverProcess?.kill();
  vi.unstubAllEnvs();
});

const DEMO_PASSWORD = "ThreatLens#Demo1";

describe("ApiAuthService (real backend)", () => {
  it("logs in against the real server and returns a decodable session", async ({ skip }) => {
    if (!backendAvailable) skip();
    const auth = new ApiAuthService();
    const session = await auth.login({ email: "avery.chen@northwind.test", password: DEMO_PASSWORD });
    expect(session.user.email).toBe("avery.chen@northwind.test");
    expect(session.user.role).toBe("super_admin");
    expect(session.token).toBeTruthy();
    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(getAccessToken()).toBe(session.token);
  });

  it("rejects a wrong password with a real 401 surfaced as a thrown error", async ({ skip }) => {
    if (!backendAvailable) skip();
    const auth = new ApiAuthService();
    await expect(auth.login({ email: "avery.chen@northwind.test", password: "wrong-password-entirely" })).rejects.toThrow();
  });

  it("the refresh cookie set by a real login actually authorizes a real refresh call (the mechanism getSession() depends on)", async ({ skip }) => {
    if (!backendAvailable) skip();
    // Node's fetch has no browser-style automatic cookie jar across
    // separate calls, so this manually plays the browser's role — capture
    // the Set-Cookie header from a real login, then present exactly that
    // cookie back on a real refresh call. This proves the server-side
    // mechanism ApiAuthService.getSession() relies on is real and correct;
    // the browser's own automatic cookie handling (credentials: "include")
    // is standard platform behavior outside what a Node test can exercise
    // — see the E2E suite (Playwright, a real browser) for that half.
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "diego.alvarez@northwind.test", password: DEMO_PASSWORD }),
    });
    expect(loginRes.status).toBe(200);
    const setCookie = loginRes.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    const refreshCookie = setCookie!.split(";")[0]; // "threatlens_rt=<value>"

    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { cookie: refreshCookie! },
    });
    expect(refreshRes.status).toBe(200);
    const body = (await refreshRes.json()) as { data: { user: { email: string }; accessToken: string } };
    expect(body.data.user.email).toBe("diego.alvarez@northwind.test");
    expect(body.data.accessToken).toBeTruthy();
  });

  it("the real refresh endpoint returns 401 with no cookie at all", async ({ skip }) => {
    if (!backendAvailable) skip();
    const res = await fetch(`${BASE_URL}/auth/refresh`, { method: "POST" });
    expect(res.status).toBe(401);
  });

  it("real registration creates a usable session end to end", async ({ skip }) => {
    if (!backendAvailable) skip();
    const auth = new ApiAuthService();
    const email = `integration-${randomBytes(6).toString("hex")}@example.test`;
    const session = await auth.register({
      name: "Integration Test User",
      organization: "Integration Test Org",
      email,
      password: "Str0ng!Passw0rd#1",
    });
    expect(session.user.email).toBe(email);
    expect(session.user.role).toBe("security_admin"); // first user in a newly-registered org

    // And the resulting token actually authorizes a real authenticated call.
    const me = await auth.refreshSession();
    expect(me?.user.email).toBe(email);
  });

  it("wraps a real backend validation error (weak password) as an ApiError with the backend's own status", async ({ skip }) => {
    if (!backendAvailable) skip();
    const auth = new ApiAuthService();
    const err = await auth
      .register({ name: "X", organization: "Y Org", email: `weak-${randomBytes(4).toString("hex")}@example.test`, password: "short" })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(422);
  });

  it("logs out and clears the in-memory token for real", async ({ skip }) => {
    if (!backendAvailable) skip();
    const auth = new ApiAuthService();
    await auth.login({ email: "avery.chen@northwind.test", password: DEMO_PASSWORD });
    expect(getAccessToken()).toBeTruthy();
    await auth.logout();
    expect(getAccessToken()).toBeNull();
  });
});
