import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validBase = {
    name: "Avery Chen",
    organization: "Northwind",
    email: "avery@northwind.test",
    password: "Sup3r$ecurePass",
    confirmPassword: "Sup3r$ecurePass",
    acceptTerms: true as const,
  };

  it("accepts fully valid input", () => {
    expect(registerSchema.safeParse(validBase).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ ...validBase, confirmPassword: "different" });
    expect(result.success).toBe(false);
  });

  it("rejects a weak password", () => {
    const result = registerSchema.safeParse({ ...validBase, password: "weak", confirmPassword: "weak" });
    expect(result.success).toBe(false);
  });

  it("requires terms acceptance", () => {
    const result = registerSchema.safeParse({ ...validBase, acceptTerms: false as unknown as true });
    expect(result.success).toBe(false);
  });
});
