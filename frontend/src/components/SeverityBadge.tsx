import type { CSSProperties } from "react";
import type { Severity } from "@/types";
import { SEVERITY_CONFIG } from "@/constants/severity";
import { Icon } from "./Icon";
import { cn } from "@/utils/cn";
import styles from "./SeverityBadge.module.css";

export interface SeverityBadgeProps {
  severity: Severity;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Severity is always communicated as icon + label + color together — never
 * color alone (spec: accessibility + security severity visual language).
 */
export function SeverityBadge({ severity, size = "md", className }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity];
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
