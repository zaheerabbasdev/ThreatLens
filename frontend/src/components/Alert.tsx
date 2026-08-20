import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { cn } from "@/utils/cn";
import styles from "./Alert.module.css";

export type AlertTone = "info" | "success" | "warning" | "danger";

const TONE_ICON: Record<AlertTone, IconName> = {
  info: "circle-info",
  success: "circle-check",
  warning: "triangle-exclamation",
  danger: "circle-xmark",
};

export interface AlertProps {
  tone?: AlertTone;
  title: string;
  children?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

/** Inline status banner. Always icon + label, never color alone. */
export function AlertBanner({ tone = "info", title, children, onDismiss, className }: AlertProps) {
  return (
    <div className={cn(styles.root, styles[tone], className)} role={tone === "danger" ? "alert" : "status"}>
      <Icon name={TONE_ICON[tone]} size="md" className={styles.icon} />
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        {children && <div className={styles.body}>{children}</div>}
      </div>
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
          <Icon name="xmark" size="sm" />
        </button>
      )}
    </div>
  );
}
