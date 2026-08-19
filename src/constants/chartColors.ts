import type { Severity } from "@/types";

/**
 * Recharts (and any inline-SVG visualization) renders to raw SVG attributes,
 * so chart series need literal hex values rather than CSS custom properties.
 * These intentionally mirror the severity tokens in src/styles/tokens.css —
 * keep them in sync if the palette changes.
 */
export const SEVERITY_HEX: Record<Severity, string> = {
  critical: "#e5484d",
  high: "#f2994a",
  medium: "#f2c94c",
  low: "#3a8de5",
  info: "#8a94a6",
};

export const CHART_GRID_COLOR = "#212932";
export const CHART_AXIS_COLOR = "#5d6b7e";
export const CHART_TOOLTIP_BG = "#161c25";
export const CHART_TOOLTIP_BORDER = "#2c3742";
