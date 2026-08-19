export type Role = "super_admin" | "security_admin" | "security_analyst" | "viewer";

export type UserStatus = "active" | "invited" | "suspended" | "deactivated";

/**
 * Full persisted user record. `passwordHash` never leaves this layer — every
 * response to a client goes through `toPublicUser` first.
 */
export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  title?: string;
  /** Seeds the frontend's deterministic avatar color — always equal to `id`; never independently settable, see UserRepository.create. */
  avatarSeed: string;
  mfaEnabled: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  lastActiveAt: string | null;
}

/** What a client is ever allowed to see. */
export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
