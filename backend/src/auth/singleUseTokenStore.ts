import { createHash, randomBytes, randomInt } from "node:crypto";

/**
 * Backs both password-reset and email-verification tokens (spec §14: random,
 * short-lived, single-use, and — "prefer storing a hash of the reset token
 * rather than the raw token" — only a SHA-256 digest is ever kept here, so a
 * leaked store dump doesn't hand out usable tokens. In-memory for Phase 3,
 * same as the refresh-token store; a restart invalidates pending tokens,
 * which is an acceptable Phase 3 tradeoff.
 */
interface Entry {
  userId: string;
  expiresAt: number;
}

export class SingleUseTokenStore {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly ttlMs: number) {}

  private digest(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /** Returns the raw token — give this to the user (email link), never store it. */
  issue(userId: string): string {
    const token = randomBytes(32).toString("base64url");
    this.entries.set(this.digest(token), { userId, expiresAt: Date.now() + this.ttlMs });
    return token;
  }

  issueCode(userId: string): string {
    const code = randomInt(100000, 1000000).toString();
    this.entries.set(this.digest(code), { userId, expiresAt: Date.now() + this.ttlMs });
    return code;
  }

  /** Consumes the token if valid and unexpired; returns the associated userId, or null. Always single-use — valid or not, a presented token is removed. */
  consume(token: string): string | null {
    const key = this.digest(token);
    const entry = this.entries.get(key);
    this.entries.delete(key);
    if (!entry || entry.expiresAt < Date.now()) return null;
    return entry.userId;
  }

  /** Invalidates any outstanding token for this user without needing to know it — used when a new one is issued, or the flow no longer applies (e.g. already-verified). */
  revokeAllFor(userId: string): void {
    for (const [key, entry] of this.entries) {
      if (entry.userId === userId) this.entries.delete(key);
    }
  }
}

/** 1 hour — matches the frontend's password-reset UX copy expectations. */
export const passwordResetTokens = new SingleUseTokenStore(60 * 60_000);
export const invitationTokens = new SingleUseTokenStore(7 * 24 * 60 * 60_000);
/** 24 hours — verification links are less time-sensitive than a reset. */
export const emailVerificationTokens = new SingleUseTokenStore(24 * 60 * 60_000);
