import type { ReportType } from "@/types";
import type { IconName } from "@/components/Icon";

export const REPORT_TYPE_CONFIG: Record<ReportType, { label: string; icon: IconName; description: string }> = {
  security_summary: {
    label: "Security Summary",
    icon: "shield-halved",
    description: "Incidents, alerts, and overall risk posture for the period.",
  },
  incident_report: {
    label: "Incident Report",
    icon: "fire",
    description: "Every incident opened within the period, with severity breakdown.",
  },
  threat_intelligence: {
    label: "Threat Intelligence",
    icon: "magnifying-glass-chart",
    description: "Highest-risk indicators and the ATT&CK techniques observed most often.",
  },
  risk_report: {
    label: "Risk Report",
    icon: "gauge-high",
    description: "The deterministic organizational risk score and its contributing factors.",
  },
  activity_report: {
    label: "Activity Report",
    icon: "clipboard-list",
    description: "A record of security-relevant actions taken across the workspace.",
  },
};

export const REPORT_TYPE_ORDER: ReportType[] = [
  "security_summary",
  "incident_report",
  "threat_intelligence",
  "risk_report",
  "activity_report",
];
