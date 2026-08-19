import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";
import { hashPassword } from "../security/password.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";
const STRONG_PASSWORD = "Str0ng!Passw0rd#1";

async function buildApp() {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  // A suspended account, for the "correct password but inactive" path.
  userRepository.seed({
    id: "user_suspended",
    organizationId: "org_northwind",
    name: "Suspended User",
    email: "suspended@northwind.test",
    passwordHash: await hashPassword(DEMO_PASSWORD),
    role: "viewer",
    status: "suspended",
    mfaEnabled: false,
    emailVerifiedAt: null,
    createdAt: new Date().toISOString(),
    lastActiveAt: null,
  });
  return { app: createApp({ userRepository }), userRepository };
}

/** Pulls the httpOnly refresh cookie out of a supertest response's Set-Cookie header. */
function refreshCookieFrom(res: request.Response): string {
  const cookies = (res.headers["set-cookie"] ?? []) as unknown as string[];
  const raw = cookies.find((c) => c.startsWith("threatlens_rt="));
  if (!raw) throw new Error("No refresh cookie set on response");
  return raw.split(";")[0]!;
}

describe("auth", () => {
  let app: Awaited<ReturnType<typeof buildApp>>["app"];

  beforeEach(async () => {
    ({ app } = await buildApp());
  });

  describe("register", () => {
    it("creates a new account and returns tokens + a dev verification token", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "New Analyst",
        organization: "New Org",
        email: "new.analyst@example.test",
        password: STRONG_PASSWORD,
      });
      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe("new.analyst@example.test");
      expect(res.body.data.user.role).toBe("security_admin");
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(typeof res.body.data.accessToken).toBe("string");
      expect(typeof res.body.data.devVerificationToken).toBe("string");
      expect(refreshCookieFrom(res)).toMatch(/^threatlens_rt=/);
    });

    it("rejects a duplicate email", async () => {
      const payload = {
        name: "Dup",
        organization: "Org",
        email: "avery.chen@northwind.test", // already seeded
        password: STRONG_PASSWORD,
      };
      const res = await request(app).post("/api/v1/auth/register").send(payload);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("rejects a password that fails the complexity policy", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "Weak",
        organization: "Org",
        email: "weak@example.test",
        password: "short",
      });
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("login", () => {
    it("succeeds with correct demo credentials", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "avery.chen@northwind.test", password: DEMO_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe("super_admin");
      expect(typeof res.body.data.accessToken).toBe("string");
    });

    it("rejects a wrong password with a generic message", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "avery.chen@northwind.test", password: "wrong-password-here" });
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe("Invalid email or password.");
    });

    it("rejects a nonexistent email with the exact same message as a wrong password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "nobody@northwind.test", password: "wrong-password-here" });
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe("Invalid email or password.");
    });

    it("rejects a suspended account only after the password is proven correct", async () => {
      const wrongPassword = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "suspended@northwind.test", password: "wrong-password-here" });
      expect(wrongPassword.status).toBe(401);
      expect(wrongPassword.body.error.message).toBe("Invalid email or password.");

      const rightPassword = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "suspended@northwind.test", password: DEMO_PASSWORD });
      expect(rightPassword.status).toBe(403);
      expect(rightPassword.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("GET /me", () => {
    it("rejects a request with no Authorization header", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
    });

    it("rejects a garbage bearer token", async () => {
      const res = await request(app).get("/api/v1/auth/me").set("Authorization", "Bearer not-a-real-token");
      expect(res.status).toBe(401);
    });

    it("returns the current user for a valid access token", async () => {
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "avery.chen@northwind.test", password: DEMO_PASSWORD });
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${login.body.data.accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("avery.chen@northwind.test");
    });
  });

  describe("refresh", () => {
    it("rotates the refresh token and issues a new access token", async () => {
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "avery.chen@northwind.test", password: DEMO_PASSWORD });
      const firstRefreshCookie = refreshCookieFrom(login);

      const refreshed = await request(app).post("/api/v1/auth/refresh").set("Cookie", firstRefreshCookie);
      expect(refreshed.status).toBe(200);
      expect(refreshed.body.data.accessToken).not.toBe(login.body.data.accessToken);
      expect(refreshCookieFrom(refreshed)).not.toBe(firstRefreshCookie);
    });

    it("rejects a refresh with no cookie", async () => {
      const res = await request(app).post("/api/v1/auth/refresh");
      expect(res.status).toBe(401);
    });

    it("detects reuse of an already-rotated refresh token and revokes the whole session family", async () => {
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "avery.chen@northwind.test", password: DEMO_PASSWORD });
      const firstRefreshCookie = refreshCookieFrom(login);

      const firstRefresh = await request(app).post("/api/v1/auth/refresh").set("Cookie", firstRefreshCookie);
      expect(firstRefresh.status).toBe(200);
      const secondRefreshCookie = refreshCookieFrom(firstRefresh);

      // Reusing the already-consumed first token is the "stolen token" signal.
      const reuse = await request(app).post("/api/v1/auth/refresh").set("Cookie", firstRefreshCookie);
      expect(reuse.status).toBe(401);

      // The legitimate, newer token from the same family must also now be dead.
      const afterReuse = await request(app).post("/api/v1/auth/refresh").set("Cookie", secondRefreshCookie);
      expect(afterReuse.status).toBe(401);
    });
  });

  describe("logout", () => {
    it("revokes the session so a subsequent refresh fails", async () => {
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "avery.chen@northwind.test", password: DEMO_PASSWORD });
      const refreshCookie = refreshCookieFrom(login);

      const logout = await request(app).post("/api/v1/auth/logout").set("Cookie", refreshCookie);
      expect(logout.status).toBe(200);

      const refreshAfterLogout = await request(app).post("/api/v1/auth/refresh").set("Cookie", refreshCookie);
      expect(refreshAfterLogout.status).toBe(401);
    });

    it("is idempotent — logging out twice doesn't error", async () => {
      const res = await request(app).post("/api/v1/auth/logout");
      expect(res.status).toBe(200);
    });
  });

  describe("forgot-password / reset-password", () => {
    it("responds identically whether or not the email exists (no dev token for an unknown email)", async () => {
      const known = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "avery.chen@northwind.test" });
      const unknown = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "nobody@northwind.test" });

      expect(known.status).toBe(200);
      expect(unknown.status).toBe(200);
      expect(known.body.data.sent).toBe(true);
      expect(unknown.body.data.sent).toBe(true);
      expect(typeof known.body.data.devToken).toBe("string");
      expect(unknown.body.data.devToken).toBeUndefined();
    });

    it("resets the password, invalidates the old one, and revokes existing sessions", async () => {
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "avery.chen@northwind.test", password: DEMO_PASSWORD });
      const oldRefreshCookie = refreshCookieFrom(login);

      const forgot = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "avery.chen@northwind.test" });
      const { devToken } = forgot.body.data;

      const reset = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({ token: devToken, password: STRONG_PASSWORD });
      expect(reset.status).toBe(200);

      // Old session is dead.
      const refreshAfterReset = await request(app).post("/api/v1/auth/refresh").set("Cookie", oldRefreshCookie);
      expect(refreshAfterReset.status).toBe(401);

      // Old password no longer works; new one does.
      const oldPasswordLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "avery.chen@northwind.test", password: DEMO_PASSWORD });
      expect(oldPasswordLogin.status).toBe(401);

      const newPasswordLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "avery.chen@northwind.test", password: STRONG_PASSWORD });
      expect(newPasswordLogin.status).toBe(200);
    });

    it("rejects an invalid or already-used reset token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({ token: "not-a-real-token", password: STRONG_PASSWORD });
      expect(res.status).toBe(400);
    });
  });

  describe("verify-email", () => {
    it("verifies with the token issued at registration", async () => {
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Verify Me",
        organization: "Org",
        email: "verify.me@example.test",
        password: STRONG_PASSWORD,
      });
      const res = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({ token: register.body.data.devVerificationToken });
      expect(res.status).toBe(200);
      expect(res.body.data.verified).toBe(true);
    });

    it("rejects an invalid token", async () => {
      const res = await request(app).post("/api/v1/auth/verify-email").send({ token: "garbage" });
      expect(res.status).toBe(400);
    });
  });

  describe("change-password", () => {
    it("requires authentication", async () => {
      const res = await request(app)
        .post("/api/v1/auth/change-password")
        .send({ currentPassword: DEMO_PASSWORD, newPassword: STRONG_PASSWORD });
      expect(res.status).toBe(401);
    });

    it("rejects the wrong current password", async () => {
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "avery.chen@northwind.test", password: DEMO_PASSWORD });
      const res = await request(app)
        .post("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${login.body.data.accessToken}`)
        .send({ currentPassword: "wrong-password-here", newPassword: STRONG_PASSWORD });
      expect(res.status).toBe(400);
    });

    it("changes the password and revokes existing sessions", async () => {
      const login = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "avery.chen@northwind.test", password: DEMO_PASSWORD });
      const oldRefreshCookie = refreshCookieFrom(login);

      const change = await request(app)
        .post("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${login.body.data.accessToken}`)
        .send({ currentPassword: DEMO_PASSWORD, newPassword: STRONG_PASSWORD });
      expect(change.status).toBe(200);

      const refreshAfterChange = await request(app).post("/api/v1/auth/refresh").set("Cookie", oldRefreshCookie);
      expect(refreshAfterChange.status).toBe(401);

      const newPasswordLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "avery.chen@northwind.test", password: STRONG_PASSWORD });
      expect(newPasswordLogin.status).toBe(200);
    });
  });
});
