import { randomUUID } from "node:crypto";
import type { SecurityEvent } from "../types/securityEvent.js";

interface SeedableSecurityEventRepository {
  seed(event: SecurityEvent): void | Promise<void>;
}

/**
 * Demo behavioral history for user_3 (Diego Alvarez): a routine baseline —
 * logins around 09:00 UTC on familiar endpoints — plus a burst of recent,
 * genuinely unusual activity (an off-hours login from a new location, two
 * failed authentications, and an unfamiliar endpoint). Lets
 * `POST /security-events/analyze` produce a real, non-trivial anomaly
 * result out of the box instead of an empty-baseline zero.
 */
export async function seedDemoSecurityEvents(repository: SeedableSecurityEventRepository): Promise<void> {
  const organizationId = "org_northwind";
  const userId = "user_3";

  const events: SecurityEvent[] = [];

  // Baseline: 10 routine morning logins over the prior 10 days, each
  // touching the same two familiar endpoints.
  for (let day = 10; day >= 3; day--) {
    events.push({
      id: randomUUID(),
      organizationId,
      userId,
      type: "authentication",
      description: "Routine login",
      severity: "info",
      sourceIp: "203.0.113.10",
      endpoint: "/incidents",
      timestamp: new Date(`2026-08-${String(20 - day).padStart(2, "0")}T09:0${day % 6}:00Z`).toISOString(),
    });
  }

  // Recent window: an off-hours login from a new location, two failed
  // authentications, and an unfamiliar admin endpoint — the kind of
  // cluster an analyst would actually want flagged.
  events.push(
    {
      id: randomUUID(),
      organizationId,
      userId,
      type: "authentication",
      description: "Login from an unrecognized location",
      severity: "medium",
      sourceIp: "185.220.101.47",
      isNewLocation: true,
      endpoint: "/incidents",
      timestamp: "2026-08-19T22:40:00Z",
    },
    {
      id: randomUUID(),
      organizationId,
      userId,
      type: "authentication",
      description: "Failed login attempt",
      severity: "medium",
      sourceIp: "185.220.101.47",
      authFailed: true,
      timestamp: "2026-08-19T22:41:00Z",
    },
    {
      id: randomUUID(),
      organizationId,
      userId,
      type: "authentication",
      description: "Failed login attempt",
      severity: "medium",
      sourceIp: "185.220.101.47",
      authFailed: true,
      timestamp: "2026-08-19T22:42:00Z",
    },
    {
      id: randomUUID(),
      organizationId,
      userId,
      type: "file_access",
      description: "Accessed an administrative export endpoint",
      severity: "high",
      endpoint: "/admin/export",
      isDownload: true,
      timestamp: "2026-08-19T22:45:00Z",
    },
  );

  for (const event of events) await repository.seed(event);
}
