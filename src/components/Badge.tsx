import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import styles from "./Badge.module.css";

export interface BadgeProps {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  className?: string;
}

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return <span className={cn(styles.root, styles[tone], className)}>{children}</span>;
}
