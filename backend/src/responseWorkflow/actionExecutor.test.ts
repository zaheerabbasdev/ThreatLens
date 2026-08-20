import { describe, expect, it } from "vitest";
import { SimulatedActionExecutor } from "./actionExecutor.js";
import type { ResponseAction } from "../types/responseAction.js";

function action(overrides: Partial<ResponseAction> = {}): ResponseAction {
  return {
    id: "ra_1",
    organizationId: "org_1",
    incidentId: "inc_1",
    type: "block_ip",
    target: "1.2.3.4",
    description: "Block the attacking IP",
    status: "pending_execution",
    requestedBy: "user_1",
    requestedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("SimulatedActionExecutor", () => {
  it("always reports isSimulated: true — never claims a real system was touched", async () => {
    const result = await new SimulatedActionExecutor().execute(action());
    expect(result.isSimulated).toBe(true);
  });

  it("mentions the target in the result description", async () => {
    const result = await new SimulatedActionExecutor().execute(action({ target: "evil.test", type: "block_domain" }));
    expect(result.resultDescription).toContain("evil.test");
    expect(result.resultDescription).toContain("block domain");
  });

  it("falls back to a generic description when there's no target (recommended_action)", async () => {
    const result = await new SimulatedActionExecutor().execute(
      action({ type: "recommended_action", target: undefined, description: "Force password reset for affected users" }),
    );
    expect(result.resultDescription).not.toContain("undefined");
    expect(result.resultDescription).toContain("recommended remediation");
  });

  it("explicitly states no live integration exists, never implying real execution", async () => {
    const result = await new SimulatedActionExecutor().execute(action());
    expect(result.resultDescription.toLowerCase()).toContain("no live");
  });
});
