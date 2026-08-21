import { randomUUID } from "node:crypto";
import { ConflictError, ForbiddenError, UnauthorizedError, BadRequestError } from "../errors/AppError.js";
import { env } from "../config/env.js";
import { hashPassword, verifyPassword } from "../security/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken, TokenError } from "../security/tokens.js";
import * as refreshTokenStore from "./refreshTokenStore.js";
import { passwordResetTokens, emailVerificationTokens, invitationTokens } from "./singleUseTokenStore.js";
import { toPublicUser } from "../types/user.js";
import type { PublicUser, User } from "../types/user.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { OrganizationRepository } from "../repositories/organization.repository.js";
import { slugify } from "../repositories/organization.repository.js";
import type { RegisterInput, LoginInput } from "./schemas.js";
import type { AuditService } from "../audit/audit.service.js";
import { logger } from "../utils/logger.js";
import { sendPasswordResetCode } from "./email.service.js";

/** A password hash that never validates against anything — used to keep login's response time roughly constant whether or not the email exists (spec §24: don't leak account existence through a timing side channel). */
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$rN6vXK1z5m0y5s2Yy1cQKQ8m0y5s2Yy1cQKQ8m0y5s";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: PublicUser;
  tokens: AuthTokens;
  /** Non-production only — see issueEmailVerificationToken. */
  devVerificationToken?: string;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly organizations: OrganizationRepository,
    private readonly audit: AuditService,
  ) {}

  private async issueTokenPair(user: User, family?: string): Promise<AuthTokens> {
    const [accessToken, refresh] = await Promise.all([
      signAccessToken({ sub: user.id, org: user.organizationId, role: user.role }),
      signRefreshToken(user.id, user.organizationId, family),
    ]);
    refreshTokenStore.recordIssued(refresh.jti, refresh.family, user.id);
    return { accessToken, refreshToken: refresh.token };
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("An account with this email already exists.");
    }

    const organizationId = randomUUID();
    await this.organizations.create({
      id: organizationId,
      name: input.organization,
      slug: slugify(input.organization),
      plan: "starter",
      createdAt: new Date().toISOString(),
    });

    const passwordHash = await hashPassword(input.password);
    const user = await this.users.create({
      organizationId,
      name: input.name,
      email: input.email,
      passwordHash,
      // First user of a newly created organization — matches the frontend
      // mock's registration behavior (security_admin, not super_admin: an
      // org's creator manages their own workspace, not the whole platform).
      role: "security_admin",
      status: "active",
      mfaEnabled: false,
      emailVerifiedAt: null,
      lastActiveAt: null,
    });

    const devVerificationToken = issueEmailVerificationToken(user);

    const tokens = await this.issueTokenPair(user);
    logger.info({ userId: user.id, event: "auth.register" }, "User registered");
    await this.audit.record({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.name,
      action: "USER_CREATED",
      resourceType: "user",
      resourceId: user.id,
      result: "success",
      severity: "info",
    });
    return { user: toPublicUser(user), tokens, devVerificationToken };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.users.findByEmail(input.email);

    // Verify against a real hash either way, so a nonexistent-account
    // response takes about as long as a wrong-password one.
    const passwordOk = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, input.password);

    if (!user || !passwordOk) {
      logger.warn({ event: "auth.login_failed", email: input.email }, "Login failed");
      // No organization to scope this to when the email doesn't match a
      // real account — audit it against the account's own org when known,
      // otherwise there is nowhere legitimate to file the record, so it's
      // structured logging only for that case (still captured, just not as
      // an org-scoped audit entry no organization actually owns).
      if (user) {
        await this.audit.record({
          organizationId: user.organizationId,
          actorId: user.id,
          actorName: user.name,
          action: "LOGIN_FAILED",
          resourceType: "session",
          result: "failure",
          severity: "medium",
        });
      }
      throw new UnauthorizedError("Invalid email or password.");
    }

    // Only reveal account status once the caller has proven they know the
    // password — an attacker without it learns nothing about the account.
    if (user.status !== "active") {
      throw new ForbiddenError("This account is not active. Contact your organization admin.");
    }

    const tokens = await this.issueTokenPair(user);
    await this.users.update(user.id, { lastActiveAt: new Date().toISOString() });
    logger.info({ userId: user.id, event: "auth.login" }, "User logged in");
    await this.audit.record({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.name,
      action: "LOGIN",
      resourceType: "session",
      result: "success",
      severity: "info",
    });
    return { user: toPublicUser(user), tokens };
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const claims = await verifyRefreshToken(refreshToken);
      refreshTokenStore.revokeFamily(claims.family);
      logger.info({ userId: claims.sub, event: "auth.logout" }, "User logged out");
      const user = await this.users.findById(claims.sub);
      if (user) {
        await this.audit.record({
          organizationId: user.organizationId,
          actorId: user.id,
          actorName: user.name,
          action: "LOGOUT",
          resourceType: "session",
          result: "success",
          severity: "info",
        });
      }
    } catch {
      // An already-invalid/expired token has nothing left to revoke —
      // logout is idempotent from the caller's point of view either way.
    }
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    let claims;
    try {
      claims = await verifyRefreshToken(refreshToken);
    } catch (err) {
      if (err instanceof TokenError) throw new UnauthorizedError("Session expired. Please sign in again.");
      throw err;
    }

    const outcome = refreshTokenStore.consume(claims.jti, claims.family);
    if (!outcome.ok) {
      if (outcome.reason === "already-used") {
        logger.error(
          { userId: claims.sub, event: "auth.refresh_reuse_detected" },
          "Refresh token reuse detected — session family revoked",
        );
      }
      throw new UnauthorizedError("Session expired. Please sign in again.");
    }

    const user = await this.users.findById(claims.sub);
    if (!user || user.status !== "active") {
      refreshTokenStore.revokeFamily(claims.family);
      throw new UnauthorizedError("Session expired. Please sign in again.");
    }

    // Same family: this is a continuation of one login, not a new one.
    const tokens = await this.issueTokenPair(user, claims.family);
    return { user: toPublicUser(user), tokens };
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError("Session is no longer valid.");
    return toPublicUser(user);
  }

  async forgotPassword(email: string): Promise<{ sent: true }> {
    const user = await this.users.findByEmail(email);
    // Always resolves the same way regardless of whether the email exists,
    // so the response never leaks account existence.
    if (!user || user.status !== "active") return { sent: true };

    passwordResetTokens.revokeAllFor(user.id);
    const code = passwordResetTokens.issueCode(user.id);
    await sendPasswordResetCode(user.email, code);
    logger.info({ userId: user.id, event: "auth.password_reset_requested" }, "Password reset requested");

    return { sent: true };
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    const userId = passwordResetTokens.consume(code);
    if (!user || user.id !== userId) {
      throw new BadRequestError("This password reset code is invalid or has expired.");
    }
    const passwordHash = await hashPassword(newPassword);
    const updated = await this.users.update(userId, { passwordHash });
    // Security-sensitive change — every existing session is invalidated (spec §16).
    refreshTokenStore.revokeAllForUser(userId);
    logger.info({ userId, event: "auth.password_reset" }, "Password reset completed");
    if (updated) {
      await this.audit.record({
        organizationId: updated.organizationId,
        actorId: updated.id,
        actorName: updated.name,
        action: "PASSWORD_CHANGED",
        resourceType: "user",
        resourceId: updated.id,
        result: "success",
        severity: "medium",
      });
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError("Session is no longer valid.");

    const ok = await verifyPassword(user.passwordHash, currentPassword);
    if (!ok) throw new BadRequestError("Current password is incorrect.");

    const passwordHash = await hashPassword(newPassword);
    await this.users.update(userId, { passwordHash });
    refreshTokenStore.revokeAllForUser(userId);
    logger.info({ userId, event: "auth.password_changed" }, "Password changed");
    await this.audit.record({
      organizationId: user.organizationId,
      actorId: user.id,
      actorName: user.name,
      action: "PASSWORD_CHANGED",
      resourceType: "user",
      resourceId: user.id,
      result: "success",
      severity: "medium",
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = emailVerificationTokens.consume(token);
    if (!userId) {
      throw new BadRequestError("This verification link is invalid or has expired.");
    }
    await this.users.update(userId, { emailVerifiedAt: new Date().toISOString() });
    logger.info({ userId, event: "auth.email_verified" }, "Email verified");
  }

  async acceptInvitation(token: string, password: string): Promise<void> {
    const userId = invitationTokens.consume(token);
    if (!userId) throw new BadRequestError("This invitation is invalid or has expired.");
    const user = await this.users.findById(userId);
    if (!user || user.status !== "invited") throw new BadRequestError("This invitation is invalid or has expired.");
    const updated = await this.users.update(userId, {
      passwordHash: await hashPassword(password),
      status: "active",
      emailVerifiedAt: new Date().toISOString(),
    });
    if (!updated) throw new BadRequestError("This invitation is invalid or has expired.");
    logger.info({ userId, event: "auth.invitation_accepted" }, "Invitation accepted");
  }
}

/** Same "no mailer yet" situation as forgotPassword's devToken — see its comment. */
function issueEmailVerificationToken(user: User): string | undefined {
  emailVerificationTokens.revokeAllFor(user.id);
  const token = emailVerificationTokens.issue(user.id);
  return env.NODE_ENV === "production" ? undefined : token;
}
