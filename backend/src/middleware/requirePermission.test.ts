import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { requirePermission } from "./requirePermission.js";
import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";

function mockReq(user?: Request["user"]): Request {
  return { user } as Request;
}

describe("requirePermission", () => {
  it("calls next with UnauthorizedError when req.user is unset (requireAuth didn't run)", () => {
    const next = vi.fn();
    requirePermission("incidents:read")(mockReq(undefined), {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it("calls next with ForbiddenError when the role lacks the permission", () => {
    const next = vi.fn();
    const req = mockReq({ id: "u1", organizationId: "org1", role: "viewer" });
    requirePermission("incidents:write")(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it("calls next with no arguments when the role has the permission", () => {
    const next = vi.fn();
    const req = mockReq({ id: "u1", organizationId: "org1", role: "security_analyst" });
    requirePermission("incidents:write")(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("super_admin has every permission the matrix defines", () => {
    const next = vi.fn();
    const req = mockReq({ id: "u1", organizationId: "org1", role: "super_admin" });
    requirePermission("users:manage")(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });
});
