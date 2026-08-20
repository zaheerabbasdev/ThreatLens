import type { CSSProperties } from "react";
import type { WorkflowStatus } from "@/types";
import { STATUS_CONFIG } from "@/constants/status";
import { Icon } from "./Icon";
import { cn } from "@/utils/cn";
import styles from "./SeverityBadge.module.css";

export interface StatusBadgeProps {
  status: WorkflowStatus;
  size?: "sm" | "md";
  className?: string;
}

/** Same visual language as SeverityBadge, kept as a distinct component so
 * status (workflow stage) and severity (impact) are never visually confused. */
export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(styles.root, styles[size], className)}
      style={
        {
          "--_color": config.colorVar,
          "--_bg": config.bgVar,
          "--_border": config.borderVar,
        } as CSSProperties
      }
    >
      <Icon name={config.iconName} size="xs" />
      {config.label}
    </span>
  );
}
