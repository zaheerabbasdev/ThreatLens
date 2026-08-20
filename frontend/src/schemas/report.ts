import { z } from "zod";

export const REPORT_PERIOD_PRESETS = ["7d", "30d", "90d"] as const;
export type ReportPeriodPreset = (typeof REPORT_PERIOD_PRESETS)[number];

export const REPORT_PERIOD_LABEL: Record<ReportPeriodPreset, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

export const generateReportSchema = z.object({
  type: z.enum(["security_summary", "incident_report", "threat_intelligence", "risk_report", "activity_report"]),
  title: z.string().trim().min(3, "Give the report a title"),
  period: z.enum(REPORT_PERIOD_PRESETS),
});
export type GenerateReportInput = z.infer<typeof generateReportSchema>;

export function resolvePeriod(preset: ReportPeriodPreset, now: Date = new Date()): { periodStart: string; periodEnd: string } {
  const days = { "7d": 7, "30d": 30, "90d": 90 }[preset];
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { periodStart: start.toISOString(), periodEnd: now.toISOString() };
}
