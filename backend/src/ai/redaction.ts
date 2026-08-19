/**
 * Secret redaction (spec §53/§54) — the security preprocessing layer
 * everything sent to an AI model passes through first. This is a
 * defense-in-depth backstop, not the only control: callers should already
 * be minimizing what they send (see promptSafety.ts), but this catches
 * anything that slips through — a copy-pasted log line in an incident
 * note, a credential embedded in a URL, etc.
 */
const REDACTION_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // KEY=value / KEY: value style credentials (API_KEY, SECRET, TOKEN, PASSWORD, ...).
  // The prefix/suffix around the keyword are both *optional* — a bare
  // "API_KEY=..." must match just as well as "MY_API_KEY_2=...".
  {
    pattern: /\b([A-Za-z0-9_]*(?:API[_-]?KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL|PASSWD)[A-Za-z0-9_]*)\s*[:=]\s*\S+/gi,
    replacement: "$1=[REDACTED]",
  },
  // Bearer tokens / Authorization headers
  { pattern: /\bBearer\s+[A-Za-z0-9._-]{10,}/gi, replacement: "Bearer [REDACTED]" },
  // Common cloud/provider key formats
  { pattern: /\bsk-[A-Za-z0-9]{20,}\b/g, replacement: "[REDACTED]" }, // OpenAI-style
  { pattern: /\bAKIA[0-9A-Z]{16}\b/g, replacement: "[REDACTED]" }, // AWS access key ID
  { pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, replacement: "[REDACTED]" }, // GitHub tokens
  // JWTs (three dot-separated base64url segments)
  { pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, replacement: "[REDACTED]" },
  // Argon2/bcrypt-style password hashes, in case a raw record leaks in
  { pattern: /\$(?:argon2id|argon2i|argon2d|2[aby])\$[^\s"]+/gi, replacement: "[REDACTED]" },
  // Private key blocks
  { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, replacement: "[REDACTED]" },
];

export function redactSecrets(text: string): string {
  let result = text;
  for (const { pattern, replacement } of REDACTION_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/** Applies redactSecrets to every string value in a plain object/array, recursively — for redacting a whole structured payload before it's serialized into a prompt. */
export function redactSecretsDeep<T>(value: T): T {
  if (typeof value === "string") return redactSecrets(value) as T;
  if (Array.isArray(value)) return value.map(redactSecretsDeep) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = redactSecretsDeep(v);
    return out as T;
  }
  return value;
}
