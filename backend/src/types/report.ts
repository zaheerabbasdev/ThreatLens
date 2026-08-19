export type ReportType = "security_summary" | "incident_report" | "threat_intelligence" | "risk_report" | "activity_report";

/** Mirrors the frontend's src/types/report.ts, with `organizationId` added — same reasoning as Incident. */
export interface Report {
  id: string;
  organizationId: string;
  type: ReportType;
  title: string;
  summary: string;
  generatedAt: string;
  generatedBy: string;
  periodStart: string;
  periodEnd: string;
}
