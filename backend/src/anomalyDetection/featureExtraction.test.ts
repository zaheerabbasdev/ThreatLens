import { describe, expect, it } from "vitest";
import { computeFeatures } from "./featureExtraction.js";
import type { SecurityEvent } from "../types/securityEvent.js";

const ORG = "org_1";
const USER = "user_1";
const NOW = new Date("2026-08-20T12:00:00Z");

function event(overrides: Partial<SecurityEvent>): SecurityEvent {
  return {
    id: "evt_" + Math.random(),
    organizationId: ORG,
    userId: USER,
    type: "authentication",
    description: "test event",
    severity: "info",
    timestamp: NOW.toISOString(),
    ...overrides,
  };
}

describe("computeFeatures", () => {
  it("returns all zeros for no events", () => {
    const features = computeFeatures([], 24, NOW);
    expect(features).toEqual({
      loginHourDeviation: 0,
      newGeoLocation: 0,
      requestFrequency: 0,
      resourceAccessCount: 0,
      fileDownloadCount: 0,
      authFailureCount: 0,
      unusualEndpointCount: 0,
    });
  });

  it("computes loginHourDeviation against the baseline typical hour, not an absolute clock value", () => {
    // Baseline: logins consistently around 09:00 UTC, well before the window.
    const baseline = Array.from({ length: 5 }, (_, i) =>
      event({ timestamp: new Date(`2026-08-${10 + i}T09:00:00Z`).toISOString() }),
    );
    // Window event: a login at 21:00 UTC — 12 hours off the typical hour.
    const windowLogin = event({ timestamp: "2026-08-20T21:00:00Z" });
    const features = computeFeatures([...baseline, windowLogin], 24, new Date("2026-08-21T00:00:00Z"));
    expect(features.loginHourDeviation).toBeCloseTo(12, 0);
  });

  it("stays at 0 deviation with no baseline history to compare against", () => {
    const windowLogin = event({ timestamp: "2026-08-20T21:00:00Z" });
    const features = computeFeatures([windowLogin], 24, new Date("2026-08-21T00:00:00Z"));
    expect(features.loginHourDeviation).toBe(0);
  });

  it("flags newGeoLocation when any window event is marked isNewLocation", () => {
    const features = computeFeatures([event({ isNewLocation: true })], 24, NOW);
    expect(features.newGeoLocation).toBe(1);
  });

  it("counts requests per minute over the window", () => {
    // 120 events over a 24h (1440 minute) window = 1 request every 12 minutes.
    const events = Array.from({ length: 120 }, () => event({}));
    const features = computeFeatures(events, 24, NOW);
    expect(features.requestFrequency).toBeCloseTo(120 / 1440, 5);
  });

  it("counts distinct endpoints for resourceAccessCount, not raw event count", () => {
    const events = [
      event({ endpoint: "/incidents" }),
      event({ endpoint: "/incidents" }),
      event({ endpoint: "/alerts" }),
    ];
    const features = computeFeatures(events, 24, NOW);
    expect(features.resourceAccessCount).toBe(2);
  });

  it("counts file downloads", () => {
    const events = [event({ isDownload: true }), event({ isDownload: true }), event({ isDownload: false })];
    expect(computeFeatures(events, 24, NOW).fileDownloadCount).toBe(2);
  });

  it("counts only failed authentication attempts", () => {
    const events = [
      event({ type: "authentication", authFailed: true }),
      event({ type: "authentication", authFailed: false }),
      event({ type: "authentication", authFailed: true }),
    ];
    expect(computeFeatures(events, 24, NOW).authFailureCount).toBe(2);
  });

  it("counts endpoints not seen in the baseline as unusual", () => {
    const baseline = [event({ endpoint: "/incidents", timestamp: "2026-08-01T00:00:00Z" })];
    const windowEvents = [event({ endpoint: "/admin/export" }), event({ endpoint: "/incidents" })];
    const features = computeFeatures([...baseline, ...windowEvents], 24, NOW);
    expect(features.unusualEndpointCount).toBe(1);
  });

  it("does not flag anything as unusual when there's no baseline endpoint history", () => {
    const features = computeFeatures([event({ endpoint: "/admin/export" })], 24, NOW);
    expect(features.unusualEndpointCount).toBe(0);
  });

  it("excludes events outside the window from window-based counts", () => {
    const stale = event({ isDownload: true, timestamp: "2026-08-01T00:00:00Z" });
    const fresh = event({ isDownload: true, timestamp: NOW.toISOString() });
    const features = computeFeatures([stale, fresh], 24, NOW);
    expect(features.fileDownloadCount).toBe(1);
  });
});
