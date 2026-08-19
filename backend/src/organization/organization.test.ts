import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { InMemoryUserRepository, seedDemoUsers } from "../repositories/user.repository.js";
import { InMemoryOrganizationRepository } from "../repositories/organization.repository.js";
import { seedDemoOrganization } from "../repositories/organization.seed.js";

const DEMO_PASSWORD = "ThreatLens#Demo1";

async function buildApp() {
  const userRepository = new InMemoryUserRepository();
  await seedDemoUsers(userRepository);
  const organizationRepository = new InMemoryOrganizationRepository();
  seedDemoOrganization(organizationRepository);
  return createApp({ userRepository, organizationRepository });
}

async function loginAs(app: Awaited<ReturnType<typeof buildApp>>, email: string): Promise<string> {
  const res = await request(app).post("/api/v1/auth/login").send({ email, password: DEMO_PASSWORD });
  return res.body.data.accessToken as string;
}

describe("organization", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp();
  });

  it("every role (all have settings:read) can view the current organization", async () => {
    const token = await loginAs(app, "sam.whitfield@northwind.test"); // viewer
    const res = await request(app).get("/api/v1/organization").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Northwind Retail Group");
  });

  it("a viewer (lacks settings:manage) cannot rename the organization", async () => {
    const token = await loginAs(app, "sam.whitfield@northwind.test");
    const res = await request(app)
      .patch("/api/v1/organization")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Hijacked Org Name" });
    expect(res.status).toBe(403);
  });

  it("a security_analyst (lacks settings:manage) cannot rename the organization", async () => {
    const token = await loginAs(app, "diego.alvarez@northwind.test");
    const res = await request(app)
      .patch("/api/v1/organization")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Hijacked Org Name" });
    expect(res.status).toBe(403);
  });

  it("a security_admin (has settings:manage) can rename the organization", async () => {
    const token = await loginAs(app, "priya.n@northwind.test");
    const res = await request(app)
      .patch("/api/v1/organization")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Northwind Global Retail Group" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Northwind Global Retail Group");
  });

  it("register() creates a real, persisted Organization record with the submitted name", async () => {
    const register = await request(app).post("/api/v1/auth/register").send({
      name: "Founder",
      organization: "Brand New Startup Inc.",
      email: "founder@example.test",
      password: "Str0ng!Passw0rd#1",
    });
    const token = register.body.data.accessToken as string;
    const res = await request(app).get("/api/v1/organization").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Brand New Startup Inc.");
    expect(res.body.data.slug).toBe("brand-new-startup-inc");
  });
});
