import type { ConfidenceLevel, Severity } from "@/types";

/**
 * Single source of truth for severity presentation. Every place that shows a
 * severity must use label + icon + color together — never color alone
 * (spec: UI/UX rules §14 Accessibility, §14 Security Severity Visual Language).
 * `iconName` is a Font Awesome solid icon name resolved by <SeverityBadge>.
 */
export const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; iconName: "skull-crossbones" | "triangle-exclamation" | "circle-exclamation" | "circle-info" | "circle-dot"; colorVar: string; bgVar: string; borderVar: string }
> = {
  critical: {
    label: "Critical",
    iconName: "skull-crossbones",
    colorVar: "var(--severity-critical)",
    bgVar: "var(--severity-critical-bg)",
    borderVar: "var(--severity-critical-border)",
  },
  high: {
    label: "High",
    iconName: "triangle-exclamation",
    colorVar: "var(--severity-high)",
    bgVar: "var(--severity-high-bg)",
    borderVar: "var(--severity-high-border)",
  },
  medium: {
    label: "Medium",
    iconName: "circle-exclamation",
    colorVar: "var(--severity-medium)",
    bgVar: "var(--severity-medium-bg)",
    borderVar: "var(--severity-medium-border)",
  },
  low: {
    label: "Low",
    iconName: "circle-info",
    colorVar: "var(--severity-low)",
    bgVar: "var(--severity-low-bg)",
    borderVar: "var(--severity-low-border)",
  },
  info: {
    label: "Info",
    iconName: "circle-dot",
    colorVar: "var(--severity-info)",
    bgVar: "var(--severity-info-bg)",
    borderVar: "var(--severity-info-border)",
  },
};

export const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  confirmed: "Confirmed",
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
  unverified: "Unverified",
};
