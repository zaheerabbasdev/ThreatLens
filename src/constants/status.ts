import type { WorkflowStatus } from "@/types";
import type { IconName } from "@/components/Icon";

/**
 * Single source of truth for workflow-status presentation — deliberately a
 * separate palette from severity (spec §14) so "how bad" and "where in the
 * workflow" never get visually conflated. Always icon + label + color.
 */
export const STATUS_CONFIG: Record<
  WorkflowStatus,
  { label: string; iconName: IconName; colorVar: string; bgVar: string; borderVar: string }
> = {
  new: {
    label: "New",
    iconName: "circle-dot",
    colorVar: "var(--severity-info)",
    bgVar: "var(--severity-info-bg)",
    borderVar: "var(--severity-info-border)",
  },
  open: {
    label: "Open",
    iconName: "circle-exclamation",
    colorVar: "var(--status-info)",
    bgVar: "var(--status-info-bg)",
    borderVar: "rgba(58, 141, 229, 0.35)",
  },
  investigating: {
    label: "Investigating",
    iconName: "magnifying-glass",
    colorVar: "var(--accent-400)",
    bgVar: "var(--accent-subtle-bg)",
    borderVar: "var(--accent-subtle-border)",
  },
  contained: {
    label: "Contained",
    iconName: "shield-halved",
    colorVar: "var(--status-warning)",
    bgVar: "var(--status-warning-bg)",
    borderVar: "rgba(242, 201, 76, 0.35)",
  },
  resolved: {
    label: "Resolved",
    iconName: "circle-check",
    colorVar: "var(--status-success)",
    bgVar: "var(--status-success-bg)",
    borderVar: "rgba(51, 177, 122, 0.35)",
  },
  closed: {
    label: "Closed",
    iconName: "circle-xmark",
    colorVar: "var(--text-tertiary)",
    bgVar: "var(--bg-elevated)",
    borderVar: "var(--border-default)",
  },
  false_positive: {
    label: "False Positive",
    iconName: "ban",
    colorVar: "var(--text-tertiary)",
    bgVar: "var(--bg-elevated)",
    borderVar: "var(--border-default)",
  },
};

export const STATUS_ORDER: WorkflowStatus[] = [
  "new",
  "open",
  "investigating",
  "contained",
  "resolved",
  "closed",
  "false_positive",
];

/** Statuses a human can actively transition an incident/alert through. */
export const ACTIONABLE_STATUSES: WorkflowStatus[] = [
  "open",
  "investigating",
  "contained",
  "resolved",
  "closed",
  "false_positive",
];
