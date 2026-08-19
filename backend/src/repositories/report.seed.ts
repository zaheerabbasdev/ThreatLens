import type { InMemoryReportRepository } from "./report.repository.js";
import type { Report } from "../types/report.js";

/**
 * Mirrors the frontend's src/mocks/reports.ts (same IDs/content). These are
 * seeded as fixed historical snapshots on purpose — a report's summary
 * reflects the state of the org's data at the moment it was generated, not
 * a live query, so it's correct for these to keep their original text even
 * though the current seeded incident/audit data no longer matches the
 * numbers quoted (e.g. "6 incidents" here vs. the 3 incidents seeded
 * elsewhere today). Any report created *now* via the real submit flow uses
 * report.service.ts's generateSummary, computed from current data.
 */
export function seedDemoReports(repository: InMemoryReportRepository): void {
  const organizationId = "org_northwind";

  const reports: Report[] = [
    {
      id: "report_1",
      organizationId,
      type: "security_summary",
      title: "Weekly Security Summary — Aug 9–15",
      summary: "6 incidents opened, 2 remain in active investigation. Overall risk trending up 12%.",
      generatedAt: "2026-08-16T06:00:00Z",
      generatedBy: "Scheduled Report",
      periodStart: "2026-08-09T00:00:00Z",
      periodEnd: "2026-08-15T23:59:59Z",
    },
    {
      id: "report_2",
      organizationId,
      type: "threat_intelligence",
      title: "Threat Intelligence Digest — August",
      summary: "New phishing infrastructure cluster identified targeting the finance department.",
      generatedAt: "2026-08-14T06:00:00Z",
      generatedBy: "Priya Natarajan",
      periodStart: "2026-08-01T00:00:00Z",
      periodEnd: "2026-08-14T00:00:00Z",
    },
    {
      id: "report_3",
      organizationId,
      type: "risk_report",
      title: "Organizational Risk Report — Q3",
      summary: "Overall risk score 74 (High), driven primarily by open critical incidents.",
      generatedAt: "2026-08-01T06:00:00Z",
      generatedBy: "Avery Chen",
      periodStart: "2026-07-01T00:00:00Z",
      periodEnd: "2026-08-01T00:00:00Z",
    },
    {
      id: "report_4",
      organizationId,
      type: "incident_report",
      title: "Incident Report — Aug 1–15",
      summary: "6 incidents recorded: 2 critical, 2 high, 2 medium. All finance-adjacent access paths.",
      generatedAt: "2026-08-16T07:00:00Z",
      generatedBy: "Diego Alvarez",
      periodStart: "2026-08-01T00:00:00Z",
      periodEnd: "2026-08-15T23:59:59Z",
    },
    {
      id: "report_5",
      organizationId,
      type: "activity_report",
      title: "Platform Activity Report — Aug 9–15",
      summary: "5 audit events recorded, including 1 failed sign-in from a known Tor exit node.",
      generatedAt: "2026-08-16T06:00:00Z",
      generatedBy: "Scheduled Report",
      periodStart: "2026-08-09T00:00:00Z",
      periodEnd: "2026-08-15T23:59:59Z",
    },
  ];

  for (const report of reports) repository.seed(report);
}
