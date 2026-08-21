import { randomUUID } from "node:crypto";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors/AppError.js";
import type { UserRepository, UserListParams } from "../repositories/user.repository.js";
import { toPublicUser } from "../types/user.js";
import type { PublicUser, Role, UserStatus } from "../types/user.js";
import type { PaginatedResult } from "../types/common.js";
import type { AuditService } from "../audit/audit.service.js";
import { logger } from "../utils/logger.js";
import { hashPassword } from "../security/password.js";
import { invitationTokens } from "../auth/singleUseTokenStore.js";
import { sendInvitation } from "../auth/email.service.js";
import type { InviteUserInput } from "./users.schemas.js";

export interface UpdateProfileInput {
  name: string;
  title?: string;
}

export interface InviteUserResult extends PublicUser {}

export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly audit: AuditService,
  ) {}

  async list(organizationId: string, params: UserListParams): Promise<PaginatedResult<PublicUser>> {
    const result = await this.users.list(organizationId, params);
    return { ...result, items: result.items.map(toPublicUser) };
  }

  async getById(organizationId: string, id: string): Promise<PublicUser> {
    const user = await this.getInOrg(organizationId, id);
    return toPublicUser(user);
  }

  async invite(organizationId: string, input: InviteUserInput): Promise<InviteUserResult> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) throw new ConflictError("An account with this email already exists.");

    const user = await this.users.create({
      organizationId,
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(randomUUID()),
      role: input.role,
      status: "invited",
      mfaEnabled: false,
      emailVerifiedAt: null,
      lastActiveAt: null,
    });
    invitationTokens.revokeAllFor(user.id);
    const token = invitationTokens.issue(user.id);
    await sendInvitation(user.email, user.name, input.role, token);
    logger.info({ organizationId, userId: user.id, role: user.role, event: "user.invited" }, "User invited");
    await this.recordAudit(organizationId, "system", "USER_INVITED", user.id, "info");
    return toPublicUser(user);
  }

  /**
   * A user can only be modified by themselves or someone with `users:manage`
   * — that permission is already required at the route level for
   * updateRole/updateStatus, but updateProfile/setMfaEnabled are
   * self-service actions too, so the check here is conditional rather than
   * a blanket route-level gate.
   */
  private assertCanModify(callerId: string, callerCanManageUsers: boolean, targetId: string): void {
    if (callerId === targetId || callerCanManageUsers) return;
    throw new ForbiddenError("You can only update your own profile.");
  }

  async updateProfile(
    organizationId: string,
    callerId: string,
    callerCanManageUsers: boolean,
    targetId: string,
    input: UpdateProfileInput,
  ): Promise<PublicUser> {
    await this.getInOrg(organizationId, targetId);
    this.assertCanModify(callerId, callerCanManageUsers, targetId);
    const updated = await this.users.update(targetId, { name: input.name, title: input.title });
    if (!updated) throw new NotFoundError("The requested user was not found.");
    await this.recordAudit(organizationId, callerId, "PROFILE_UPDATED", targetId);
    return toPublicUser(updated);
  }

  async setMfaEnabled(
    organizationId: string,
    callerId: string,
    callerCanManageUsers: boolean,
    targetId: string,
    enabled: boolean,
  ): Promise<PublicUser> {
    await this.getInOrg(organizationId, targetId);
    this.assertCanModify(callerId, callerCanManageUsers, targetId);
    const updated = await this.users.update(targetId, { mfaEnabled: enabled });
    if (!updated) throw new NotFoundError("The requested user was not found.");
    await this.recordAudit(organizationId, callerId, "MFA_CHANGED", targetId);
    return toPublicUser(updated);
  }

  /**
   * Role/status changes are admin-only (route requires users:manage) — but
   * even an admin can't act on themselves here. That's a deliberate safety
   * rule, not something the frontend mock enforces: without it, an admin
   * could accidentally demote or suspend their own account with no one
   * left able to reverse it.
   */
  async updateRole(organizationId: string, callerId: string, targetId: string, role: Role): Promise<PublicUser> {
    await this.getInOrg(organizationId, targetId);
    if (callerId === targetId) {
      throw new BadRequestError("You can't change your own role.");
    }
    const updated = await this.users.update(targetId, { role });
    if (!updated) throw new NotFoundError("The requested user was not found.");
    logger.info({ organizationId, targetId, role, event: "user.role_changed" }, "User role changed");
    await this.recordAudit(organizationId, callerId, "ROLE_CHANGED", targetId, "medium");
    return toPublicUser(updated);
  }

  async updateStatus(organizationId: string, callerId: string, targetId: string, status: UserStatus): Promise<PublicUser> {
    await this.getInOrg(organizationId, targetId);
    if (callerId === targetId) {
      throw new BadRequestError("You can't change your own account status.");
    }
    const updated = await this.users.update(targetId, { status });
    if (!updated) throw new NotFoundError("The requested user was not found.");
    logger.info({ organizationId, targetId, status, event: "user.status_changed" }, "User status changed");
    await this.recordAudit(organizationId, callerId, "USER_STATUS_CHANGED", targetId, "medium");
    return toPublicUser(updated);
  }

  private async getInOrg(organizationId: string, id: string) {
    const user = await this.users.findById(id);
    if (!user || user.organizationId !== organizationId) {
      throw new NotFoundError("The requested user was not found.");
    }
    return user;
  }

  private async recordAudit(
    organizationId: string,
    actorId: string,
    action: "PROFILE_UPDATED" | "MFA_CHANGED" | "ROLE_CHANGED" | "USER_STATUS_CHANGED" | "USER_INVITED",
    targetId: string,
    severity: "info" | "medium" = "info",
  ): Promise<void> {
    const actor = await this.users.findById(actorId);
    await this.audit.record({
      organizationId,
      actorId,
      actorName: actor?.name ?? "Unknown",
      action,
      resourceType: "user",
      resourceId: targetId,
      result: "success",
      severity,
    });
  }
}
