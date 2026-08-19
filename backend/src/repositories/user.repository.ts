import { randomUUID } from "node:crypto";
import { hashPassword } from "../security/password.js";
import type { User, Role, UserStatus } from "../types/user.js";
import type { PaginatedResult } from "../types/common.js";

export interface UserListParams {
  page?: number;
  pageSize?: number;
  role?: Role;
  status?: UserStatus;
  search?: string;
}

/**
 * Data access for users (spec §3/§4: repositories talk to persistence,
 * nothing above this layer knows how). This interface is the contract a
 * real MongoDB-backed implementation fulfills in Phase 5 — every consumer
 * (the auth service, and later RBAC-checked domain services) is written
 * against this interface, not against "in-memory" or "Mongo" specifically.
 *
 * Multi-tenancy note (spec §20): `findByEmail` is intentionally global —
 * email is how an unauthenticated caller identifies which account/org
 * they're logging into, so it can't be organization-scoped. Every method
 * added later that lists or queries users WITHIN a known session must take
 * `organizationId` as a required (not optional) filter, enforced here, not
 * left to callers to remember.
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(organizationId: string, params: UserListParams): Promise<PaginatedResult<User>>;
  /** `avatarSeed` is never caller-supplied — see the field's comment on User. */
  create(user: Omit<User, "id" | "createdAt" | "avatarSeed">): Promise<User>;
  update(id: string, patch: Partial<Omit<User, "id" | "organizationId">>): Promise<User | null>;
}

export class InMemoryUserRepository implements UserRepository {
  private readonly usersById = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.usersById.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    for (const user of this.usersById.values()) {
      if (user.email.toLowerCase() === normalized) return user;
    }
    return null;
  }

  async list(organizationId: string, params: UserListParams): Promise<PaginatedResult<User>> {
    let items = [...this.usersById.values()].filter((u) => u.organizationId === organizationId);
    items.sort((a, b) => a.name.localeCompare(b.name));

    if (params.role) items = items.filter((u) => u.role === params.role);
    if (params.status) items = items.filter((u) => u.status === params.status);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize).map((u) => ({ ...u }));

    return { items: pageItems, total: items.length, page, pageSize };
  }

  async create(input: Omit<User, "id" | "createdAt" | "avatarSeed">): Promise<User> {
    const id = randomUUID();
    const user: User = { ...input, id, avatarSeed: id, createdAt: new Date().toISOString() };
    this.usersById.set(user.id, user);
    return user;
  }

  async update(id: string, patch: Partial<Omit<User, "id" | "organizationId">>): Promise<User | null> {
    const existing = this.usersById.get(id);
    if (!existing) return null;
    const updated: User = { ...existing, ...patch };
    this.usersById.set(id, updated);
    return updated;
  }

  /** Test/seed helper only — never exposed through the interface real callers depend on. */
  seed(user: User): void {
    this.usersById.set(user.id, user);
  }
}

/**
 * Demo data mirroring the frontend's mock users (src/mocks/identity.ts) so
 * the same accounts work against either layer during this transitional
 * phase. Real password: the frontend's DEMO_CREDENTIALS.password, hashed
 * for real here rather than compared as plaintext.
 */
export async function seedDemoUsers(repository: InMemoryUserRepository): Promise<void> {
  const passwordHash = await hashPassword("ThreatLens#Demo1");
  const organizationId = "org_northwind";
  const now = new Date().toISOString();

  const demoUsers: Array<Omit<User, "passwordHash" | "createdAt" | "emailVerifiedAt" | "lastActiveAt" | "avatarSeed">> = [
    { id: "user_1", organizationId, name: "Avery Chen", email: "avery.chen@northwind.test", role: "super_admin", status: "active", title: "Head of Security", mfaEnabled: true },
    { id: "user_2", organizationId, name: "Priya Natarajan", email: "priya.n@northwind.test", role: "security_admin", status: "active", title: "Security Operations Manager", mfaEnabled: true },
    { id: "user_3", organizationId, name: "Diego Alvarez", email: "diego.alvarez@northwind.test", role: "security_analyst", status: "active", title: "Security Analyst II", mfaEnabled: true },
    { id: "user_4", organizationId, name: "Morgan Blake", email: "morgan.blake@northwind.test", role: "security_analyst", status: "active", title: "Security Analyst", mfaEnabled: false },
    { id: "user_5", organizationId, name: "Sam Whitfield", email: "sam.whitfield@northwind.test", role: "viewer", status: "active", title: "IT Director", mfaEnabled: false },
  ];

  for (const user of demoUsers) {
    repository.seed({ ...user, avatarSeed: user.id, passwordHash, createdAt: now, emailVerifiedAt: now, lastActiveAt: now });
  }
}
