import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import * as store from "./refreshTokenStore.js";

// The store is process-wide module state, not reset between tests — use a
// fresh random jti/family per test so tests can't interfere with each other.
function ids() {
  return { jti: randomUUID(), family: randomUUID(), userId: randomUUID() };
}

describe("refreshTokenStore", () => {
  it("consumes a freshly recorded token successfully", () => {
    const { jti, family, userId } = ids();
    store.recordIssued(jti, family, userId);
    const outcome = store.consume(jti, family);
    expect(outcome).toEqual({ ok: true, userId, family });
  });

  it("rejects an unknown jti", () => {
    const { jti, family } = ids();
    const outcome = store.consume(jti, family);
    expect(outcome).toEqual({ ok: false, reason: "unknown" });
  });

  it("rejects a jti presented under the wrong family", () => {
    const { jti, family, userId } = ids();
    store.recordIssued(jti, family, userId);
    const outcome = store.consume(jti, randomUUID());
    expect(outcome).toEqual({ ok: false, reason: "unknown" });
  });

  it("detects reuse: consuming the same token twice fails the second time", () => {
    const { jti, family, userId } = ids();
    store.recordIssued(jti, family, userId);
    expect(store.consume(jti, family).ok).toBe(true);
    expect(store.consume(jti, family)).toEqual({ ok: false, reason: "already-used" });
  });

  it("reuse of one token revokes every other active token in its family", () => {
    const { family, userId } = ids();
    const jtiA = randomUUID();
    const jtiB = randomUUID();
    store.recordIssued(jtiA, family, userId);
    store.recordIssued(jtiB, family, userId);

    // Consume A normally (as a real rotation would), then replay A again —
    // the replay should burn B too, even though B was never itself reused.
    expect(store.consume(jtiA, family).ok).toBe(true);
    expect(store.consume(jtiA, family)).toEqual({ ok: false, reason: "already-used" });
    expect(store.consume(jtiB, family)).toEqual({ ok: false, reason: "already-used" });
  });

  it("revokeAllForUser burns every token for that user across families", () => {
    const userId = randomUUID();
    const familyA = randomUUID();
    const familyB = randomUUID();
    const jtiA = randomUUID();
    const jtiB = randomUUID();
    store.recordIssued(jtiA, familyA, userId);
    store.recordIssued(jtiB, familyB, userId);

    store.revokeAllForUser(userId);

    // "already-used" (not "unknown") proves these were found and revoked,
    // not merely absent — a wrong-family/unknown-jti test wouldn't tell
    // revokeAllForUser apart from doing nothing at all.
    expect(store.consume(jtiA, familyA)).toEqual({ ok: false, reason: "already-used" });
    expect(store.consume(jtiB, familyB)).toEqual({ ok: false, reason: "already-used" });
  });
});
