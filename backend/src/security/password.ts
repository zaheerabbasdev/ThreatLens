import argon2 from "argon2";

/**
 * Argon2id password hashing (spec §14). The cost parameters below are
 * OWASP's current baseline recommendation for argon2id (m=19MiB, t=2, p=1) —
 * revisit if server memory budget or measured login latency demands it.
 */
const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, HASH_OPTIONS);
}

export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plaintext);
  } catch {
    // A malformed/foreign hash throws rather than returning false — treat
    // it the same as a wrong password instead of letting the error surface.
    return false;
  }
}
