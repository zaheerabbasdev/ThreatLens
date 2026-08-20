import type { AccountStatus } from "@/types";
import type { IconName } from "@/components/Icon";

/** Single source of truth for account-status presentation — icon + label + color, never color alone. */
export const ACCOUNT_STATUS_CONFIG: Record<
  AccountStatus,
  { label: string; iconName: IconName; colorVar: string; bgVar: string; borderVar: string }
> = {
  active: {
    label: "Active",
    iconName: "circle-check",
    colorVar: "var(--status-success)",
    bgVar: "var(--status-success-bg)",
    borderVar: "rgba(51, 177, 122, 0.35)",
  },
  invited: {
    label: "Invited",
    iconName: "envelope",
    colorVar: "var(--status-info)",
    bgVar: "var(--status-info-bg)",
    borderVar: "rgba(58, 141, 229, 0.35)",
  },
  suspended: {
    label: "Suspended",
    iconName: "triangle-exclamation",
    colorVar: "var(--status-warning)",
    bgVar: "var(--status-warning-bg)",
    borderVar: "rgba(242, 201, 76, 0.35)",
  },
  deactivated: {
    label: "Deactivated",
    iconName: "ban",
    colorVar: "var(--text-tertiary)",
    bgVar: "var(--bg-elevated)",
    borderVar: "var(--border-default)",
  },
};

export const ACCOUNT_STATUS_ORDER: AccountStatus[] = ["active", "invited", "suspended", "deactivated"];
