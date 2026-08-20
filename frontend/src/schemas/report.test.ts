import { describe, expect, it } from "vitest";
import { resolvePeriod } from "./report";

describe("resolvePeriod", () => {
  const now = new Date("2026-08-15T12:00:00Z");

  it("resolves a 7-day window ending now", () => {
    const { periodStart, periodEnd } = resolvePeriod("7d", now);
    expect(periodEnd).toBe(now.toISOString());
    expect(periodStart).toBe("2026-08-08T12:00:00.000Z");
  });

  it("resolves a 30-day window ending now", () => {
    const { periodStart, periodEnd } = resolvePeriod("30d", now);
    expect(periodEnd).toBe(now.toISOString());
    expect(periodStart).toBe("2026-07-16T12:00:00.000Z");
  });

  it("resolves a 90-day window ending now", () => {
    const { periodStart } = resolvePeriod("90d", now);
    expect(new Date(periodStart).getTime()).toBe(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  });
});
