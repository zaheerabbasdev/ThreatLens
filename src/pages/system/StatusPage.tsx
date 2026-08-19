import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon, type IconName } from "@/components/Icon";
import { Button } from "@/components/Button";
import styles from "./StatusPage.module.css";

export interface StatusPageProps {
  icon: IconName;
  eyebrow: string;
  title: string;
  description: string;
  primaryAction?: { label: string; to: string };
  secondaryAction?: { label: string; to: string };
  children?: ReactNode;
}

/** Shared shell for 403/404/error/coming-soon states — never a blank page. */
export function StatusPage({
  icon,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}: StatusPageProps) {
  return (
    <div className={styles.root}>
      <div className={styles.iconWrap}>
        <Icon name={icon} size="xl" />
      </div>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      {children}
      {(primaryAction || secondaryAction) && (
        <div className={styles.actions}>
          {primaryAction && (
            <Link to={primaryAction.to}>
              <Button>{primaryAction.label}</Button>
            </Link>
          )}
          {secondaryAction && (
            <Link to={secondaryAction.to}>
              <Button variant="secondary">{secondaryAction.label}</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
