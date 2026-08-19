import { randomUUID } from "node:crypto";
import { BadRequestError, NotFoundError } from "../errors/AppError.js";
import type { ReportRepository, ReportListParams } from "../repositories/report.repository.js";
import type { IncidentRepository } from "../repositories/incident.repository.js";
import type { IndicatorRepository } from "../repositories/indicator.repository.js";
import type { AuditLogRepository } from "../repositories/auditLog.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { Report, ReportType } from "../types/report.js";
import type { PaginatedResult } from "../types/common.js";
import type { CreateReportInput } from "./report.schemas.js";
import type { AuditService } from "../audit/audit.service.js";

const ALL_ROWS = 10_000; // see mitre.service.ts's identical comment on the same in-memory-phase tradeoff

function withinPeriod(iso: string, start: string, end: string): boolean {
  const t = new Date(iso).getTime();
  return t >= new Date(start).getTime() && t <= new Date(end).getTime();
}

export class ReportService {
  constructor(
    private readonly reports: ReportRepository,
    private readonly incidents: IncidentRepository,
    private readonly indicators: IndicatorRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly users: UserRepository,
    private readonly audit: AuditService,
  ) {}

  list(organizationId: string, params: ReportListParams): Promise<PaginatedResult<Report>> {
    return this.reports.list(organizationId, params);
  }

  async getById(organizationId: string, id: string): Promise<Report> {
    const report = await this.reports.getById(organizationId, id);
    if (!report) throw new NotFoundError("The requested report was not found.");
    return report;
  }

  async create(organizationId: string, actorId: string, input: CreateReportInput): Promise<Report> {
    const actor = await this.users.findById(actorId);
    if (!actor || actor.organizationId !== organizationId) {
      throw new BadRequestError("Could not resolve the requesting user.");
    }

    const summary = await this.generateSummary(organizationId, input.type, input.periodStart, input.periodEnd);

    const report: Report = {
      id: randomUUID(),
      organizationId,
      type: input.type,
      title: input.title,
      summary,
      generatedAt: new Date().toISOString(),
      generatedBy: actor.name,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    };
    const created = await this.reports.create(report);

    // Closest match in the audit action vocabulary (spec §38 has
    // REPORT_EXPORTED, not a distinct "generated" action) — a freshly
    // generated report is, functionally, the thing being exported here.
    await this.audit.record({
      organizationId,
      actorId,
      actorName: actor.name,
      action: "REPORT_EXPORTED",
      resourceType: "report",
      resourceId: created.id,
      result: "success",
      severity: "info",
    });

    return created;
  }

  /**
   * Computed from this organization's real data at generation time — same
   * principle as the frontend mock's own generateSummary (it isn't a
   * canned string there either). Unlike the mock, this also draws on real
   * audit logs and indicator counts, since those repositories now exist
   * server-side.
   *
   * risk_report is the one honest exception: there's no risk-scoring
   * engine yet (spec §48/§49 — a later phase, and risk scores are never
   * something an AI/report layer invents on its own), so rather than
   * fabricate a number, the summary says so plainly.
   */
  private async generateSummary(
    organizationId: string,
    type: ReportType,
    periodStart: string,
    periodEnd: string,
  ): Promise<string> {
    switch (type) {
      case "security_summary": {
        const incidents = await this.incidentsInPeriod(organizationId, periodStart, periodEnd);
        const critical = incidents.filter((i) => i.severity === "critical").length;
        return `${plural(incidents.length, "incident")} opened in this period (${critical} critical).`;
      }
      case "incident_report": {
        const incidents = await this.incidentsInPeriod(organizationId, periodStart, periodEnd);
        if (incidents.length === 0) return "No incidents were recorded in this period.";
        const bySeverity = new Map<string, number>();
        for (const i of incidents) bySeverity.set(i.severity, (bySeverity.get(i.severity) ?? 0) + 1);
        const breakdown = [...bySeverity.entries()].map(([sev, count]) => `${count} ${sev}`).join(", ");
        return `${plural(incidents.length, "incident")} recorded: ${breakdown}.`;
      }
      case "threat_intelligence": {
        const incidents = await this.incidentsInPeriod(organizationId, periodStart, periodEnd);
        const highRisk = incidents.filter((i) => i.severity === "critical" || i.severity === "high").length;
        const { total: indicatorCount } = await this.indicators.list(organizationId, { pageSize: ALL_ROWS });
        return `Tracking ${indicatorCount} indicator${indicatorCount === 1 ? "" : "s"}, with ${highRisk} high-or-critical severity incident${highRisk === 1 ? "" : "s"} in this period.`;
      }
      case "risk_report":
        return "Deterministic risk scoring isn't available yet — this report type will include it once the risk engine is built.";
      case "activity_report": {
        const { items: auditItems } = await this.auditLogs.list(organizationId, { pageSize: ALL_ROWS });
        const inPeriod = auditItems.filter((a) => withinPeriod(a.timestamp, periodStart, periodEnd));
        const failures = inPeriod.filter((a) => a.result === "failure").length;
        return `${plural(inPeriod.length, "audit event")} recorded${failures > 0 ? `, including ${plural(failures, "failed action")}` : ""}.`;
      }
    }
  }

  private async incidentsInPeriod(organizationId: string, periodStart: string, periodEnd: string) {
    const { items } = await this.incidents.list(organizationId, { pageSize: ALL_ROWS });
    return items.filter((i) => withinPeriod(i.createdAt, periodStart, periodEnd));
  }
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
