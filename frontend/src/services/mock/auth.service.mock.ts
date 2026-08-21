import type {
  AuthService,
  ChangePasswordInput,
  LoginInput,
  PasswordResetRequestResult,
  RegisterInput,
} from "@/services/auth.service";
import type { AuthSession, User } from "@/types";
import { DEMO_CREDENTIALS, MOCK_USERS } from "@/mocks/identity";
import { generateId } from "@/utils/id";
import { delay } from "./util";

export const AUTH_SESSION_STORAGE_KEY = "threatlens.session";
const SESSION_KEY = AUTH_SESSION_STORAGE_KEY;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function readSession(): AuthSession | null {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AuthSession;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeSession(user: User): AuthSession {
  const session: AuthSession = {
    user,
    token: generateId("mock_token"),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export class MockAuthService implements AuthService {
  async login({ email, password }: LoginInput): Promise<AuthSession> {
    await delay(undefined, 500);
    const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || password !== DEMO_CREDENTIALS.password) {
      throw new Error("Invalid email or password.");
    }
    if (user.status !== "active") {
      throw new Error("This account is not active. Contact your organization admin.");
    }
    return writeSession(user);
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    await delay(undefined, 600);
    const existing = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === input.email.trim().toLowerCase(),
    );
    if (existing) {
      throw new Error("An account with this email already exists.");
    }
    const newUser: User = {
      id: generateId("user"),
      organizationId: "org_new",
      name: input.name,
      email: input.email,
      role: "security_admin",
      status: "active",
      avatarSeed: generateId("avatar"),
      createdAt: new Date().toISOString(),
      mfaEnabled: false,
    };
    return writeSession(newUser);
  }

  async requestPasswordReset(_email: string): Promise<PasswordResetRequestResult> {
    await delay(undefined, 500);
    // Always resolves the same way regardless of whether the email exists,
    // so the UI never leaks account existence.
    return { sent: true };
  }

  async resetPassword({ code }: { email: string; code: string; password: string }): Promise<{ success: boolean }> {
    await delay(undefined, 500);
    if (code === "invalid") {
      return { success: false };
    }
    return { success: true };
  }

  async acceptInvitation(_input: { token: string; password: string }): Promise<{ accepted: boolean }> {
    await delay(undefined, 500);
    return { accepted: true };
  }

  async verifyEmail(token: string): Promise<{ verified: boolean }> {
    await delay(undefined, 500);
    return { verified: token !== "invalid" };
  }

  async getSession(): Promise<AuthSession | null> {
    await delay(undefined, 150);
    return readSession();
  }

  async refreshSession(): Promise<AuthSession | null> {
    const current = readSession();
    if (!current) return null;
    const fresh = MOCK_USERS.find((u) => u.id === current.user.id);
    if (!fresh) return current;
    return writeSession({ ...fresh });
  }

  async changePassword(input: ChangePasswordInput): Promise<{ success: boolean }> {
    await delay(undefined, 500);
    // Mocked against the shared demo password (no per-user password store
    // exists yet) — still gives the UI a real success/failure path to
    // exercise rather than always succeeding.
    return { success: input.currentPassword === DEMO_CREDENTIALS.password };
  }

  async logout(): Promise<void> {
    await delay(undefined, 150);
    window.localStorage.removeItem(SESSION_KEY);
  }
}
