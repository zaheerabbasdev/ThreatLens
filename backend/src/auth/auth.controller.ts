import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../errors/AppError.js";
import type { AuthService, AuthResult } from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
} from "./schemas.js";

const REFRESH_COOKIE = "threatlens_rt";
/** 30 days, matching signRefreshToken's TTL. */
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Cookie scoped to /api/v1/auth only — the refresh token is never sent on
 * any other request, minimizing what a non-auth endpoint's response
 * handling could ever expose it to. `sameSite: "strict"` is this cookie's
 * CSRF defense (spec §27: don't assume JWT makes CSRF moot — analyze the
 * actual mechanism, which for THIS specific cookie-authenticated endpoint
 * means the browser refuses to attach it to a cross-site request at all,
 * regardless of origin, so a forged cross-site refresh/logout can't
 * succeed even without a separate CSRF token). Every other route in this
 * API takes its auth from the Authorization header, which is immune to
 * CSRF by construction — a cross-site form/img/script tag has no way to
 * set a custom header.
 */
function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
}

function getRefreshCookie(req: Request): string {
  const token = (req.cookies as Record<string, string | undefined> | undefined)?.[REFRESH_COOKIE];
  if (!token) throw new UnauthorizedError("Session expired. Please sign in again.");
  return token;
}

function sendAuthResult(res: Response, result: AuthResult, statusCode = 200): void {
  setRefreshCookie(res, result.tokens.refreshToken);
  sendSuccess(
    res,
    {
      user: result.user,
      accessToken: result.tokens.accessToken,
      ...(result.devVerificationToken ? { devVerificationToken: result.devVerificationToken } : {}),
    },
    undefined,
    statusCode,
  );
}

export type AuthController = ReturnType<typeof createAuthController>;

export function createAuthController(service: AuthService) {
  return {
    register: asyncHandler(async (req, res) => {
      const input = registerSchema.parse(req.body);
      const result = await service.register(input);
      sendAuthResult(res, result, 201);
    }),

    login: asyncHandler(async (req, res) => {
      const input = loginSchema.parse(req.body);
      const result = await service.login(input);
      sendAuthResult(res, result);
    }),

    logout: asyncHandler(async (req, res) => {
      const token = (req.cookies as Record<string, string | undefined> | undefined)?.[REFRESH_COOKIE];
      if (token) await service.logout(token);
      clearRefreshCookie(res);
      sendSuccess(res, { loggedOut: true });
    }),

    refresh: asyncHandler(async (req, res) => {
      const token = getRefreshCookie(req);
      const result = await service.refresh(token);
      sendAuthResult(res, result);
    }),

    me: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError("Authentication is required.");
      const user = await service.me(req.user.id);
      sendSuccess(res, { user });
    }),

    forgotPassword: asyncHandler(async (req, res) => {
      const input = forgotPasswordSchema.parse(req.body);
      const result = await service.forgotPassword(input.email);
      sendSuccess(res, { sent: true, ...result });
    }),

    resetPassword: asyncHandler(async (req, res) => {
      const input = resetPasswordSchema.parse(req.body);
      await service.resetPassword(input.token, input.password);
      sendSuccess(res, { success: true });
    }),

    verifyEmail: asyncHandler(async (req, res) => {
      const input = verifyEmailSchema.parse(req.body);
      await service.verifyEmail(input.token);
      sendSuccess(res, { verified: true });
    }),

    changePassword: asyncHandler(async (req, res) => {
      if (!req.user) throw new UnauthorizedError("Authentication is required.");
      const input = changePasswordSchema.parse(req.body);
      await service.changePassword(req.user.id, input.currentPassword, input.newPassword);
      clearRefreshCookie(res); // every session was just revoked, including this one
      sendSuccess(res, { success: true });
    }),
  };
}
