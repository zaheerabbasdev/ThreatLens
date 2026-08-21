import type {
  AuthService,
  ChangePasswordInput,
  LoginInput,
  PasswordResetRequestResult,
  RegisterInput,
} from "@/services/auth.service";
import type { AuthSession, User } from "@/types";
import { apiRequest, ApiError, getAccessToken, setAccessToken } from "./client";

interface AuthResultBody {
  user: User;
  accessToken: string;
  devVerificationToken?: string;
}

/** Reads the `exp` claim out of a JWT without verifying it — this is our own server's response over an authenticated HTTPS connection, so trusting the claim client-side (purely to know when to proactively re-auth) is fine; the backend independently re-verifies the signature on every request regardless. Falls back to a conservative 5-minute estimate if the token isn't shaped as expected, rather than throwing. */
function decodeJwtExpiry(token: string): string {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) throw new Error("not a JWT");
    const json = atob(payloadSegment.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { exp?: number };
    if (typeof payload.exp === "number") return new Date(payload.exp * 1000).toISOString();
  } catch {
    // fall through to the estimate below
  }
  return new Date(Date.now() + 5 * 60 * 1000).toISOString();
}

function toSession(body: AuthResultBody): AuthSession {
  setAccessToken(body.accessToken);
  return { user: body.user, token: body.accessToken, expiresAt: decodeJwtExpiry(body.accessToken) };
}

/** True for the specific "your input was rejected" failures (BadRequestError, 400) the backend uses for an invalid/expired token or wrong password — the cases this interface expects as a falsy `{success: false}` return rather than a thrown exception, matching MockAuthService's contract. Any other status (network failure, 5xx, unexpected 401/403) still throws, same as everywhere else in this client. */
function isRejectedInput(err: unknown): boolean {
  return err instanceof ApiError && err.status === 400;
}

export class ApiAuthService implements AuthService {
  async login(input: LoginInput): Promise<AuthSession> {
    const body = await apiRequest<AuthResultBody>("/auth/login", { method: "POST", body: input });
    return toSession(body);
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    const body = await apiRequest<AuthResultBody>("/auth/register", { method: "POST", body: input });
    return toSession(body);
  }

  async requestPasswordReset(email: string): Promise<PasswordResetRequestResult> {
    return apiRequest<PasswordResetRequestResult>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  }

  async resetPassword(input: { token: string; password: string }): Promise<{ success: boolean }> {
    try {
      await apiRequest<{ success: boolean }>("/auth/reset-password", { method: "POST", body: input });
      return { success: true };
    } catch (err) {
      if (isRejectedInput(err)) return { success: false };
      throw err;
    }
  }

  async verifyEmail(token: string): Promise<{ verified: boolean }> {
    try {
      await apiRequest<{ verified: boolean }>("/auth/verify-email", { method: "POST", body: { token } });
      return { verified: true };
    } catch (err) {
      if (isRejectedInput(err)) return { verified: false };
      throw err;
    }
  }

  /** Boot-time session restore: the access token lives only in memory, so a page reload has none — this exchanges the httpOnly refresh cookie the browser still holds for a fresh one. No cookie (or an expired/revoked one) means "not signed in," not an error. */
  async getSession(): Promise<AuthSession | null> {
    try {
      const body = await apiRequest<AuthResultBody>("/auth/refresh", { method: "POST" });
      return toSession(body);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) return null;
      throw err;
    }
  }

  async refreshSession(): Promise<AuthSession | null> {
    const token = getAccessToken();
    if (!token) return null;
    try {
      const { user } = await apiRequest<{ user: User }>("/auth/me");
      return { user, token, expiresAt: decodeJwtExpiry(token) };
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  }

  async changePassword(input: ChangePasswordInput): Promise<{ success: boolean }> {
    try {
      await apiRequest<{ success: boolean }>("/auth/change-password", {
        method: "POST",
        body: { currentPassword: input.currentPassword, newPassword: input.newPassword },
      });
      return { success: true };
    } catch (err) {
      if (isRejectedInput(err)) return { success: false };
      throw err;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiRequest<{ loggedOut: true }>("/auth/logout", { method: "POST" });
    } finally {
      // Always clear the in-memory token, even if the network call failed
      // (e.g. already offline) — the user's intent to sign out locally
      // should never be blocked by a request the server-side session
      // revocation can't complete anyway.
      setAccessToken(null);
    }
  }
}
