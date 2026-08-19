import type { CSSProperties } from "react";
import type { AccountStatus } from "@/types";
import { ACCOUNT_STATUS_CONFIG } from "@/constants/accountStatus";
import { Icon } from "./Icon";
import { cn } from "@/utils/cn";
import styles from "./SeverityBadge.module.css";

export interface AccountStatusBadgeProps {
  status: AccountStatus;
  size?: "sm" | "md";
  className?: string;
}

/** Same visual language as SeverityBadge/StatusBadge — icon + label + color, never color alone. */
export function AccountStatusBadge({ status, size = "md", className }: AccountStatusBadgeProps) {
  const config = ACCOUNT_STATUS_CONFIG[status];
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
