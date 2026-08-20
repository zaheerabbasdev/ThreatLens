import { describe, expect, it } from "vitest";
import { roleHasPermission } from "./roles";

describe("roleHasPermission", () => {
  it("grants super_admin every permission", () => {
    expect(roleHasPermission("super_admin", "users:manage")).toBe(true);
    expect(roleHasPermission("super_admin", "audit:read")).toBe(true);
  });

  it("denies security_admin the users:manage permission", () => {
    expect(roleHasPermission("security_admin", "users:manage")).toBe(false);
    expect(roleHasPermission("security_admin", "incidents:write")).toBe(true);
  });

  it("denies viewers write permissions", () => {
    expect(roleHasPermission("viewer", "incidents:write")).toBe(false);
    expect(roleHasPermission("viewer", "incidents:read")).toBe(true);
  });

  it("grants security_analyst incident and alert write access", () => {
    expect(roleHasPermission("security_analyst", "incidents:write")).toBe(true);
    expect(roleHasPermission("security_analyst", "alerts:write")).toBe(true);
    expect(roleHasPermission("security_analyst", "users:manage")).toBe(false);
  });
});
