import type { SecurityEvent } from "../types/securityEvent.js";

/**
 * The exact seven features spec §42 names, in the exact order the Python
 * service's FEATURE_NAMES expects (ml-service/app/schemas.py) — keeping
 * both lists in the same order matters, so this file's field order is the
 * single source of truth on the Node side.
 */
export interface EventFeatures {
  loginHourDeviation: number;
  newGeoLocation: number;
  requestFrequency: number;
  resourceAccessCount: number;
  fileDownloadCount: number;
  authFailureCount: number;
  unusualEndpointCount: number;
}

function circularHourDiff(a: number, b: number): number {
  const diff = Math.abs(a - b) % 24;
  return Math.min(diff, 24 - diff);
}

/**
 * Deterministic feature computation from raw SecurityEvents — never AI,
 * never the ML service's job (it only ever sees the finished numbers,
 * spec §42). `events` should already be scoped to one organization + one
 * user; this function doesn't re-check tenant isolation, the repository
 * layer does (spec §19/§20, same as every other domain module).
 *
 * Splits `events` into a "baseline" (everything before the window — what
 * "typical" means for this user) and the "window" itself (what's being
 * scored). With no baseline history, deviation-dependent features default
 * to 0 rather than guessing — an unproven user isn't the same as a
 * confirmed-anomalous one.
 */
export function computeFeatures(events: SecurityEvent[], windowHours: number, now: Date = new Date()): EventFeatures {
  const windowStartMs = now.getTime() - windowHours * 60 * 60 * 1000;
  const windowEvents = events.filter((e) => new Date(e.timestamp).getTime() >= windowStartMs);
  const baselineEvents = events.filter((e) => new Date(e.timestamp).getTime() < windowStartMs);

  const baselineLoginHours = baselineEvents.filter((e) => e.type === "authentication").map((e) => new Date(e.timestamp).getUTCHours());
  const windowLoginHours = windowEvents.filter((e) => e.type === "authentication").map((e) => new Date(e.timestamp).getUTCHours());

  let loginHourDeviation = 0;
  if (baselineLoginHours.length > 0 && windowLoginHours.length > 0) {
    const typicalHour = baselineLoginHours.reduce((sum, h) => sum + h, 0) / baselineLoginHours.length;
    loginHourDeviation = Math.max(...windowLoginHours.map((h) => circularHourDiff(h, typicalHour)));
  }

  const newGeoLocation = windowEvents.some((e) => e.isNewLocation) ? 1 : 0;

  const requestFrequency = windowHours > 0 ? windowEvents.length / (windowHours * 60) : 0;

  const resourceAccessCount = new Set(windowEvents.map((e) => e.endpoint).filter((e): e is string => Boolean(e))).size;

  const fileDownloadCount = windowEvents.filter((e) => e.isDownload).length;

  const authFailureCount = windowEvents.filter((e) => e.type === "authentication" && e.authFailed).length;

  const knownEndpoints = new Set(baselineEvents.map((e) => e.endpoint).filter((e): e is string => Boolean(e)));
  const unusualEndpointCount =
    knownEndpoints.size > 0
      ? windowEvents.filter((e) => e.endpoint && !knownEndpoints.has(e.endpoint)).length
      : 0;

  return {
    loginHourDeviation,
    newGeoLocation,
    requestFrequency,
    resourceAccessCount,
    fileDownloadCount,
    authFailureCount,
    unusualEndpointCount,
  };
}
