import { z } from "zod";

/**
 * Input validation (spec §21). This is the authoritative check — the
 * frontend's matching rules (src/schemas/auth.ts) are UX, this is security.
 * Password policy is kept identical on purpose so a user is never told
 * "accepted" by the client and then rejected by the API.
 */
const passwordRule = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(256, "Password is too long")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number")
  .regex(/[^A-Za-z0-9]/, "Include a symbol");

const emailRule = z.string().trim().min(1).max(254).email().transform((v) => v.toLowerCase());

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  organization: z.string().trim().min(2).max(120),
  email: emailRule,
  password: passwordRule,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1).max(256),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailRule,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: emailRule,
  code: z.string().regex(/^\d{6}$/, "Enter the six-digit reset code."),
  password: passwordRule,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1).max(512),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().min(1).max(512),
  password: passwordRule,
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: passwordRule,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
