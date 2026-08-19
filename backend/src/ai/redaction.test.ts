import { describe, expect, it } from "vitest";
import { redactSecrets, redactSecretsDeep } from "./redaction.js";

describe("redactSecrets", () => {
  it("redacts KEY=value style credentials", () => {
    expect(redactSecrets("API_KEY=super_secret_value_123")).toBe("API_KEY=[REDACTED]");
    expect(redactSecrets("DB_PASSWORD: hunter2hunter2")).toBe("DB_PASSWORD=[REDACTED]");
  });

  it("redacts Bearer tokens", () => {
    expect(redactSecrets("Authorization: Bearer abcdefghij1234567890")).toBe(
      "Authorization: Bearer [REDACTED]",
    );
  });

  it("redacts OpenAI-style API keys", () => {
    expect(redactSecrets(`my key is sk-${"a".repeat(30)}`)).toBe("my key is [REDACTED]");
  });

  it("redacts AWS access key IDs", () => {
    expect(redactSecrets("AKIAABCDEFGHIJKLMNOP is my key")).toBe("[REDACTED] is my key");
  });

  it("redacts GitHub tokens", () => {
    expect(redactSecrets(`token: ghp_${"a".repeat(30)}`)).toContain("[REDACTED]");
  });

  it("redacts JWTs", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    expect(redactSecrets(`token=${jwt}`)).toBe("token=[REDACTED]");
  });

  it("redacts argon2id password hashes", () => {
    const hash = "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$rN6vXK1z5m0y5s2Yy1cQKQ";
    expect(redactSecrets(`hash: ${hash}`)).toBe("hash: [REDACTED]");
  });

  it("redacts private key blocks", () => {
    const key = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----";
    expect(redactSecrets(key)).toBe("[REDACTED]");
  });

  it("leaves ordinary text untouched", () => {
    const text = "The incident affected the finance-mailbox-pool asset with critical severity.";
    expect(redactSecrets(text)).toBe(text);
  });

  it("redacts multiple secrets in the same string", () => {
    const text = "API_KEY=abc123 and also Bearer xyzxyzxyzxyzxyzxyz789";
    const result = redactSecrets(text);
    expect(result).not.toContain("abc123");
    expect(result).not.toContain("xyzxyzxyzxyzxyzxyz789");
  });
});

describe("redactSecretsDeep", () => {
  it("redacts secrets inside nested object values", () => {
    const input = {
      title: "Suspicious login",
      notes: "Found API_KEY=leaked_value_here in the logs",
      nested: { detail: "Bearer abcdefghij1234567890" },
      tags: ["normal-tag", "API_KEY=another_leak"],
    };
    const result = redactSecretsDeep(input);
    expect(result.notes).toBe("Found API_KEY=[REDACTED] in the logs");
    expect(result.nested.detail).toBe("Bearer [REDACTED]");
    expect(result.tags[1]).toBe("API_KEY=[REDACTED]");
    expect(result.title).toBe("Suspicious login"); // untouched, no secret present
  });

  it("passes through non-string primitives unchanged", () => {
    const input = { count: 5, active: true, missing: null };
    expect(redactSecretsDeep(input)).toEqual(input);
  });
});
