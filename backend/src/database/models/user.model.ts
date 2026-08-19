import { Schema, model } from "mongoose";
import { randomUUID } from "node:crypto";
import type { Role, UserStatus } from "../../types/user.js";

/**
 * Explicit document shape rather than Mongoose's `InferSchemaType` — that
 * inference is too weak here (enums, `select: false`, and a custom string
 * `_id` all degrade it to `unknown`/`FlattenMaps<unknown>` per-field, which
 * defeats the point of typing this at all). Declaring the shape by hand
 * keeps `.lean()` results properly typed; every model in this codebase
 * follows the same pattern.
 */
export interface UserDoc {
  _id: string;
  organizationId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  title?: string;
  avatarSeed: string;
  mfaEnabled: boolean;
  emailVerifiedAt: Date | null;
  lastActiveAt: Date | null;
  createdAt: Date;
}

/**
 * Mongoose schema for the User collection (spec §9/§10).
 *
 * `_id` is a plain string (our existing UUID/seed-ID scheme, e.g. "user_1"
 * or a randomUUID()), not Mongo's default ObjectId — this keeps IDs
 * identical between the in-memory and Mongo-backed repositories, so
 * nothing above the repository layer (services, controllers, seeded
 * cross-references like `assignedAnalystId`) has to change based on which
 * one is active.
 *
 * Indexes (spec §11, based on actual query patterns, not "index everything"):
 * - `email` unique — every login does a lookup by email, and uniqueness is
 *   enforced at the database level as a second line of defense behind the
 *   application-level check in AuthService.register.
 * - `organizationId` — every query against this collection is org-scoped
 *   (spec §20 multi-tenancy); this is the one index that's load-bearing
 *   for literally every read.
 */
const userSchema = new Schema<UserDoc>(
  {
    _id: { type: String, default: () => randomUUID() },
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    // Never validated for shape here beyond "is a string" — it's an Argon2id
    // hash produced by security/password.ts, not user input reaching this
    // layer directly.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ["super_admin", "security_admin", "security_analyst", "viewer"] },
    status: { type: String, required: true, enum: ["active", "invited", "suspended", "deactivated"] },
    title: { type: String, trim: true, maxlength: 120 },
    avatarSeed: { type: String, required: true },
    mfaEnabled: { type: Boolean, required: true, default: false },
    emailVerifiedAt: { type: Date, default: null },
    lastActiveAt: { type: Date, default: null },
  },
  {
    // createdAt only — there's no updatedAt in the domain type today, and
    // adding a field nothing reads yet would be exactly the kind of
    // unjustified schema bloat spec §10 warns against.
    timestamps: { createdAt: true, updatedAt: false },
    // passwordHash must never appear in a toJSON()/toObject() call by
    // accident — `select: false` above already excludes it from normal
    // queries, but this is a second, independent backstop: even a query
    // that explicitly re-selects it can't leak it through serialization.
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret["passwordHash"];
        return ret;
      },
    },
  },
);

export const UserModel = model<UserDoc>("User", userSchema);
