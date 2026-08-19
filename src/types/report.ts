import type { ISODateString } from "./common";

export type ReportType =
  | "security_summary"
  | "incident_report"
  | "threat_intelligence"
  | "risk_report"
  | "activity_report";

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  summary: string;
  generatedAt: ISODateString;
  generatedBy: string;
  periodStart: ISODateString;
  periodEnd: ISODateString;
}
