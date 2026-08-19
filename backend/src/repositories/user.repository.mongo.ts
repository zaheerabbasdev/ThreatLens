import { UserModel } from "../database/models/user.model.js";
import type { UserDoc } from "../database/models/user.model.js";
import type { UserRepository, UserListParams } from "./user.repository.js";
import type { User } from "../types/user.js";
import type { PaginatedResult } from "../types/common.js";

/**
 * NOTE ON VERIFICATION: this class could not be run against a real MongoDB
 * instance in the environment it was written in (see backend/README.md's
 * Phase 5 section for why) — it's been typechecked against Mongoose's own
 * types and reviewed carefully against the exact query shapes
 * InMemoryUserRepository already handles (and that ARE covered by real,
 * executed tests), but it has not itself been exercised against a live
 * database. Run the mongo-backed test suite once against a real MongoDB
 * before relying on this in production.
 */

// `passwordHash` has `select: false` in the schema (defense in depth against
// accidental leakage) — every method here needs the full domain object per
// the UserRepository contract, so every query below explicitly re-selects it.
function toDomain(doc: UserDoc): User {
  return {
    id: doc._id,
    organizationId: doc.organizationId,
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    role: doc.role,
    status: doc.status,
    title: doc.title,
    avatarSeed: doc.avatarSeed,
    mfaEnabled: doc.mfaEnabled,
    emailVerifiedAt: doc.emailVerifiedAt ? doc.emailVerifiedAt.toISOString() : null,
    lastActiveAt: doc.lastActiveAt ? doc.lastActiveAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export class MongoUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).select("+passwordHash").lean<UserDoc>();
    return doc ? toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.trim().toLowerCase() })
      .select("+passwordHash")
      .lean<UserDoc>();
    return doc ? toDomain(doc) : null;
  }

  async list(organizationId: string, params: UserListParams): Promise<PaginatedResult<User>> {
    const filter: Record<string, unknown> = { organizationId };
    if (params.role) filter["role"] = params.role;
    if (params.status) filter["status"] = params.status;
    if (params.search) {
      const escaped = params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(escaped, "i");
      filter["$or"] = [{ name: pattern }, { email: pattern }];
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const [docs, total] = await Promise.all([
      UserModel.find(filter)
        .select("+passwordHash")
        .sort({ name: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<UserDoc[]>(),
      UserModel.countDocuments(filter),
    ]);

    return { items: docs.map(toDomain), total, page, pageSize };
  }

  async create(input: Omit<User, "id" | "createdAt" | "avatarSeed">): Promise<User> {
    // Constructing (not yet saving) already runs the `_id` schema default,
    // so avatarSeed = id can be set before the one validation/save pass —
    // same rule InMemoryUserRepository.create enforces, just without a
    // separate create-then-update round trip.
    const doc = new UserModel(input);
    doc.avatarSeed = doc._id;
    await doc.save();
    return toDomain(doc.toObject());
  }

  async update(id: string, patch: Partial<Omit<User, "id" | "organizationId">>): Promise<User | null> {
    const doc = await UserModel.findByIdAndUpdate(id, patch, { new: true }).select("+passwordHash").lean<UserDoc>();
    return doc ? toDomain(doc) : null;
  }

  /** Seed helper — mirrors InMemoryUserRepository.seed's role; not part of the public UserRepository interface. Upserts so re-running the seed script is idempotent. */
  async seed(user: User): Promise<void> {
    await UserModel.findByIdAndUpdate(user.id, { _id: user.id, ...user }, { upsert: true, setDefaultsOnInsert: true });
  }
}
