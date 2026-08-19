/**
 * Tracks issued refresh tokens so they can be rotated and revoked (spec
 * §16/§17). In-memory for Phase 3 — a restart invalidates every session,
 * which is acceptable for now and gets replaced by persistent storage
 * (Redis/DB) in a later phase; nothing above this module needs to change
 * when that happens.
 *
 * Rotation + reuse detection: each refresh consumes the presented token's
 * jti and issues a new one in the same `family`. If a jti is presented that
 * isn't in the store as "active" — because it was already consumed, or
 * never existed — every token in that family is revoked. That's the
 * standard signal for "a refresh token was stolen and used after the
 * legitimate client also used it (or is about to)": one of the two is an
 * attacker, so the whole lineage is burned rather than guessing which.
 */
interface RefreshTokenRecord {
  family: string;
  userId: string;
  revoked: boolean;
}

const store = new Map<string, RefreshTokenRecord>();

export function recordIssued(jti: string, family: string, userId: string): void {
  store.set(jti, { family, userId, revoked: false });
}

export type RefreshOutcome =
  | { ok: true; userId: string; family: string }
  | { ok: false; reason: "unknown" | "already-used" };

/** Consumes `jti` if it's a currently-active token in its family; returns why not, otherwise. */
export function consume(jti: string, family: string): RefreshOutcome {
  const record = store.get(jti);
  if (!record || record.family !== family) {
    return { ok: false, reason: "unknown" };
  }
  if (record.revoked) {
    revokeFamily(family);
    return { ok: false, reason: "already-used" };
  }
  record.revoked = true;
  return { ok: true, userId: record.userId, family };
}

export function revokeFamily(family: string): void {
  for (const record of store.values()) {
    if (record.family === family) record.revoked = true;
  }
}

export function revokeAllForUser(userId: string): void {
  for (const record of store.values()) {
    if (record.userId === userId) record.revoked = true;
  }
}
