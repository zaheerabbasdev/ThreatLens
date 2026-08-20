import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { cn } from "@/utils/cn";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(styles.root, className)}>
      <div className={styles.iconWrap}>
        <Icon name={icon} size="xl" />
      </div>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
