import type { AuthSession } from "@/types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  organization: string;
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/**
 * Auth service contract. `MockAuthService` implements this today; a future
 * `ApiAuthService` backed by the real backend replaces it without any
 * change required in components/hooks that depend on this interface.
 */
export interface AuthService {
  login(input: LoginInput): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  requestPasswordReset(email: string): Promise<{ sent: true }>;
  resetPassword(input: { token: string; password: string }): Promise<{ success: boolean }>;
  verifyEmail(token: string): Promise<{ verified: boolean }>;
  getSession(): Promise<AuthSession | null>;
  /** Re-syncs the current session's user data from the source of truth —
   * used after a profile/role/status edit so the signed-in session (and
   * anything reading it, like the topbar) reflects the change immediately. */
  refreshSession(): Promise<AuthSession | null>;
  changePassword(input: ChangePasswordInput): Promise<{ success: boolean }>;
  logout(): Promise<void>;
}
