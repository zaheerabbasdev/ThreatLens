import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";

async function buildApp() {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  return createApp({ userRepository });
}

async function loginAs(app: Awaited<ReturnType<typeof buildApp>>, email: string): Promise<string> {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: DEMO_PASSWORD });
  return res.body.data.accessToken as string;
}

describe("users", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp();
  });

  describe("list / getById", () => {
    it("super_admin (has users:read) can list users", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(5);
      expect(res.body.data.every((u: { passwordHash?: string }) => u.passwordHash === undefined)).toBe(true);
    });

    it("a viewer (lacks users:read) cannot list users", async () => {
      const token = await loginAs(app, "sam.whitfield@northwind.test");
      const res = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("a security_analyst (lacks users:read) cannot list users", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it("IDOR guard: an outsider gets 404 for another org's user", async () => {
      const register = await request(app).post("/api/v1/auth/register").send({
        name: "Outsider",
        organization: "Some Other Company",
        email: "outsider-users@example.test",
        password: "Str0ng!Passw0rd#1",
      });
      const outsiderToken = register.body.data.accessToken as string;
      const res = await request(app).get("/api/v1/users/user_1").set("Authorization", `Bearer ${outsiderToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("self-service profile edit", () => {
    it("a viewer can edit their own profile despite lacking users:read/manage", async () => {
      const token = await loginAs(app, "sam.whitfield@northwind.test");
      const res = await request(app)
        .patch("/api/v1/users/user_5/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Samantha Whitfield", title: "Director of IT" });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Samantha Whitfield");
    });

    it("a viewer cannot edit someone else's profile", async () => {
      const token = await loginAs(app, "sam.whitfield@northwind.test");
      const res = await request(app)
        .patch("/api/v1/users/user_4/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Hijacked Name" });
      expect(res.status).toBe(403);
    });

    it("super_admin (has users:manage) can edit someone else's profile", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app)
        .patch("/api/v1/users/user_4/profile")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Morgan B. Blake" });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Morgan B. Blake");
    });

    it("a user can toggle their own MFA setting", async () => {
      const token = await loginAs(app, "diego.alvarez@northwind.test");
      const res = await request(app)
        .patch("/api/v1/users/user_3/mfa")
        .set("Authorization", `Bearer ${token}`)
        .send({ enabled: false });
      expect(res.status).toBe(200);
      expect(res.body.data.mfaEnabled).toBe(false);
    });
  });

  describe("admin role/status management", () => {
    it("super_admin can change another user's role", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app)
        .patch("/api/v1/users/user_4/role")
        .set("Authorization", `Bearer ${token}`)
        .send({ role: "security_admin" });
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("security_admin");
    });

    it("security_admin (lacks users:manage) cannot change roles", async () => {
      const token = await loginAs(app, "priya.n@northwind.test");
      const res = await request(app)
        .patch("/api/v1/users/user_4/role")
        .set("Authorization", `Bearer ${token}`)
        .send({ role: "security_admin" });
      expect(res.status).toBe(403);
    });

    it("a super_admin cannot change their own role, even though they have users:manage", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app)
        .patch("/api/v1/users/user_1/role")
        .set("Authorization", `Bearer ${token}`)
        .send({ role: "viewer" });
      expect(res.status).toBe(400);
    });

    it("a super_admin cannot change their own account status", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app)
        .patch("/api/v1/users/user_1/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "suspended" });
      expect(res.status).toBe(400);
    });

    it("super_admin can suspend another user's account", async () => {
      const token = await loginAs(app, "avery.chen@northwind.test");
      const res = await request(app)
        .patch("/api/v1/users/user_4/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "suspended" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("suspended");
    });
  });
});
