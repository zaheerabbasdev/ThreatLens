import type { CreateReportInput, ReportService } from "@/services/report.service";
import type { PageRequest, PaginatedResult, Report, ReportType } from "@/types";
import { MOCK_REPORTS } from "@/mocks/reports";
import { MOCK_INCIDENTS } from "@/mocks/incidents";
import { MOCK_AUDIT_LOGS } from "@/mocks/auditLogs";
import { MOCK_RISK_SCORES } from "@/mocks/riskScores";
import { SEVERITY_CONFIG } from "@/constants/severity";
import { generateId } from "@/utils/id";
import { delay, paginate } from "./util";

function withinPeriod(iso: string, start: string, end: string): boolean {
  const t = new Date(iso).getTime();
  return t >= new Date(start).getTime() && t <= new Date(end).getTime();
}

/** Computed from real mock data at creation time — not a canned string. */
function generateSummary(type: ReportType, periodStart: string, periodEnd: string): string {
  switch (type) {
    case "security_summary": {
      const incidents = MOCK_INCIDENTS.filter((i) => withinPeriod(i.createdAt, periodStart, periodEnd));
      const critical = incidents.filter((i) => i.severity === "critical").length;
      const risk = MOCK_RISK_SCORES.org_overall;
      return `${incidents.length} incident${incidents.length === 1 ? "" : "s"} opened in this period (${critical} critical). Overall risk score ${risk?.value ?? "—"}/100 (${risk ? SEVERITY_CONFIG[risk.severity].label : "unknown"}).`;
    }
    case "incident_report": {
      const incidents = MOCK_INCIDENTS.filter((i) => withinPeriod(i.createdAt, periodStart, periodEnd));
      const bySeverity = incidents.reduce<Record<string, number>>((acc, i) => {
        acc[i.severity] = (acc[i.severity] ?? 0) + 1;
        return acc;
      }, {});
      const breakdown = Object.entries(bySeverity)
        .map(([sev, count]) => `${count} ${SEVERITY_CONFIG[sev as keyof typeof SEVERITY_CONFIG].label.toLowerCase()}`)
        .join(", ");
      return incidents.length === 0
        ? "No incidents were recorded in this period."
        : `${incidents.length} incident${incidents.length === 1 ? "" : "s"} recorded: ${breakdown}.`;
    }
    case "threat_intelligence": {
      const highRisk = MOCK_INCIDENTS.filter((i) => i.severity === "critical" || i.severity === "high").length;
      return `Tracking activity across the current indicator set, with ${highRisk} high-or-critical severity incidents correlated to known infrastructure.`;
    }
    case "risk_report": {
      const risk = MOCK_RISK_SCORES.org_overall;
      return risk
        ? `Overall risk score ${risk.value}/100 (${SEVERITY_CONFIG[risk.severity].label}), driven primarily by ${risk.factors[0]?.label.toLowerCase() ?? "current findings"}.`
        : "Risk score unavailable.";
    }
    case "activity_report": {
      const events = MOCK_AUDIT_LOGS.filter((a) => withinPeriod(a.timestamp, periodStart, periodEnd));
      const failures = events.filter((a) => a.result === "failure").length;
      return `${events.length} audit event${events.length === 1 ? "" : "s"} recorded${failures > 0 ? `, including ${failures} failed action${failures === 1 ? "" : "s"}` : ""}.`;
    }
  }
}

export class MockReportService implements ReportService {
  async list(params?: PageRequest & { type?: ReportType }): Promise<PaginatedResult<Report>> {
    let items = [...MOCK_REPORTS].sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
    );
    if (params?.type) items = items.filter((r) => r.type === params.type);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((r) => r.title.toLowerCase().includes(q));
    }
    return delay(paginate(items.map((r) => ({ ...r })), params), 300);
  }

  async getById(id: string): Promise<Report | null> {
    await delay(undefined, 250);
    const report = MOCK_REPORTS.find((r) => r.id === id);
    return report ? { ...report } : null;
  }

  async create(input: CreateReportInput, generatedBy: string): Promise<Report> {
    await delay(undefined, 600);
    const report: Report = {
      id: generateId("report"),
      type: input.type,
      title: input.title,
      summary: generateSummary(input.type, input.periodStart, input.periodEnd),
      generatedAt: new Date().toISOString(),
      generatedBy,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    };
    MOCK_REPORTS.unshift(report);
    return report;
  }
}
