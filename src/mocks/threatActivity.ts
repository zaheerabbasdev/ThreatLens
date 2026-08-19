export interface ThreatActivityPoint {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/** 14-day trailing activity series powering the dashboard timeline chart. */
export const MOCK_THREAT_ACTIVITY: ThreatActivityPoint[] = [
  { date: "2026-08-02", critical: 0, high: 2, medium: 3, low: 5 },
  { date: "2026-08-03", critical: 1, high: 1, medium: 4, low: 4 },
  { date: "2026-08-04", critical: 0, high: 3, medium: 2, low: 6 },
  { date: "2026-08-05", critical: 0, high: 1, medium: 5, low: 3 },
  { date: "2026-08-06", critical: 1, high: 2, medium: 3, low: 4 },
  { date: "2026-08-07", critical: 0, high: 0, medium: 2, low: 5 },
  { date: "2026-08-08", critical: 0, high: 1, medium: 3, low: 3 },
  { date: "2026-08-09", critical: 1, high: 2, medium: 4, low: 6 },
  { date: "2026-08-10", critical: 1, high: 3, medium: 3, low: 5 },
  { date: "2026-08-11", critical: 0, high: 2, medium: 2, low: 4 },
  { date: "2026-08-12", critical: 0, high: 1, medium: 4, low: 5 },
  { date: "2026-08-13", critical: 0, high: 1, medium: 3, low: 3 },
  { date: "2026-08-14", critical: 1, high: 2, medium: 2, low: 4 },
  { date: "2026-08-15", critical: 2, high: 2, medium: 1, low: 3 },
];

export interface SystemHealthMetric {
  label: string;
  status: "operational" | "degraded" | "outage";
  detail: string;
}

export const MOCK_SYSTEM_HEALTH: SystemHealthMetric[] = [
  { label: "Event ingestion", status: "operational", detail: "Processing normally" },
  { label: "Mail gateway feed", status: "operational", detail: "Processing normally" },
  { label: "Endpoint protection feed", status: "operational", detail: "Processing normally" },
  { label: "Threat intel sync", status: "degraded", detail: "Provider latency above baseline" },
];
