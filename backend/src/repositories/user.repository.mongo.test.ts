import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoUserRepository } from "./user.repository.mongo.js";
import { UserModel } from "../database/models/user.model.js";

/**
 * Real integration test against a real (ephemeral, in-process) MongoDB
 * instance via mongodb-memory-server — not a mock of the Mongoose layer.
 *
 * IMPORTANT: this suite could not be executed in the environment it was
 * written in. `mongodb-memory-server` downloads an actual MongoDB server
 * binary (~600MB) on first use, and that download was measured at roughly
 * 0.16 MB/s here — over an hour for one run, in a sandbox with no
 * persistent cache between sessions. The code below is real, follows the
 * standard pattern for this library, and was written the same way every
 * other test in this codebase was (to actually run and assert against
 * live behavior) — it just hasn't been run here. Run `npm test -- user.repository.mongo`
 * once yourself, anywhere with normal internet access, before trusting
 * MongoUserRepository in production. See backend/README.md's Phase 5
 * section for the full explanation.
 */
describe("MongoUserRepository", () => {
  let mongod: MongoMemoryServer;
  const repo = new MongoUserRepository();

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }, 120_000);

  afterEach(async () => {
    await UserModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  const baseInput = {
    organizationId: "org_1",
    name: "Ada Lovelace",
    email: "Ada@Example.TEST", // deliberately mixed-case, to check normalization
    passwordHash: "argon2id$fake-hash-for-testing",
    role: "security_analyst" as const,
    status: "active" as const,
    mfaEnabled: false,
    emailVerifiedAt: null,
    lastActiveAt: null,
  };

  it("creates a user with a generated id and avatarSeed equal to that id", async () => {
    const user = await repo.create(baseInput);
    expect(user.id).toBeTruthy();
    expect(user.avatarSeed).toBe(user.id);
    expect(user.createdAt).toBeTruthy();
  });

  it("normalizes email to lowercase on create, and findByEmail is case-insensitive", async () => {
    await repo.create(baseInput);
    const found = await repo.findByEmail("ADA@example.test");
    expect(found?.email).toBe("ada@example.test");
  });

  it("enforces email uniqueness at the database level", async () => {
    await repo.create(baseInput);
    await expect(repo.create({ ...baseInput, name: "Someone Else" })).rejects.toThrow();
  });

  it("findById and findByEmail both return the full domain object including passwordHash", async () => {
    const created = await repo.create(baseInput);
    const byId = await repo.findById(created.id);
    const byEmail = await repo.findByEmail(baseInput.email);
    expect(byId?.passwordHash).toBe(baseInput.passwordHash);
    expect(byEmail?.passwordHash).toBe(baseInput.passwordHash);
  });

  it("findById returns null for a nonexistent id", async () => {
    expect(await repo.findById("does-not-exist")).toBeNull();
  });

  it("update patches only the given fields and returns the full updated user", async () => {
    const created = await repo.create(baseInput);
    const updated = await repo.update(created.id, { status: "suspended" });
    expect(updated?.status).toBe("suspended");
    expect(updated?.name).toBe(baseInput.name); // untouched fields survive
  });

  it("update returns null for a nonexistent id", async () => {
    expect(await repo.update("does-not-exist", { status: "suspended" })).toBeNull();
  });

  describe("list", () => {
    beforeAll(async () => {
      await UserModel.deleteMany({});
      await Promise.all([
        repo.create({ ...baseInput, name: "Zed Org1", email: "zed@org1.test", organizationId: "org_1", role: "viewer" }),
        repo.create({ ...baseInput, name: "Amy Org1", email: "amy@org1.test", organizationId: "org_1", role: "super_admin" }),
        repo.create({ ...baseInput, name: "Bob Org2", email: "bob@org2.test", organizationId: "org_2" }),
      ]);
    });

    it("only returns users from the requested organization (tenant isolation)", async () => {
      const result = await repo.list("org_1", {});
      expect(result.total).toBe(2);
      expect(result.items.every((u) => u.organizationId === "org_1")).toBe(true);
    });

    it("sorts by name", async () => {
      const result = await repo.list("org_1", {});
      expect(result.items.map((u) => u.name)).toEqual(["Amy Org1", "Zed Org1"]);
    });

    it("filters by role", async () => {
      const result = await repo.list("org_1", { role: "super_admin" });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe("Amy Org1");
    });

    it("filters by search across name and email, case-insensitively", async () => {
      const result = await repo.list("org_1", { search: "ZED" });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe("Zed Org1");
    });

    it("paginates correctly", async () => {
      const page1 = await repo.list("org_1", { page: 1, pageSize: 1 });
      expect(page1.items).toHaveLength(1);
      expect(page1.total).toBe(2);
      const page2 = await repo.list("org_1", { page: 2, pageSize: 1 });
      expect(page2.items).toHaveLength(1);
      expect(page1.items[0]?.id).not.toBe(page2.items[0]?.id);
    });
  });

  it("seed() upserts idempotently — seeding the same id twice doesn't create a duplicate", async () => {
    await repo.seed({ ...baseInput, id: "user_fixed", avatarSeed: "user_fixed", createdAt: new Date().toISOString() });
    await repo.seed({ ...baseInput, id: "user_fixed", avatarSeed: "user_fixed", name: "Updated Name", createdAt: new Date().toISOString() });
    const count = await UserModel.countDocuments({ _id: "user_fixed" });
    expect(count).toBe(1);
    const found = await repo.findById("user_fixed");
    expect(found?.name).toBe("Updated Name");
  });
});
