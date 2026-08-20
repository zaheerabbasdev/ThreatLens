import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { Icon, type IconName } from "./Icon";
import { Skeleton } from "./Skeleton";
import { useReducedMotion } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";
import styles from "./StatTile.module.css";

export interface StatTileProps {
  label: string;
  value?: number;
  formattedValue?: string;
  icon: IconName;
  tone?: "neutral" | "accent" | "danger" | "warning" | "success";
  trend?: { direction: "up" | "down"; label: string };
  loading?: boolean;
  className?: string;
}

export function StatTile({
  label,
  value,
  formattedValue,
  icon,
  tone = "neutral",
  trend,
  loading,
  className,
}: StatTileProps) {
  const valueRef = useRef<HTMLParagraphElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (loading || value === undefined || !valueRef.current) return;
    const el = valueRef.current;
    if (reducedMotion) {
      el.textContent = formattedValue ?? String(value);
      return;
    }
    const counter = { current: 0 };
    animate(counter, {
      current: value,
      duration: 700,
      ease: "outExpo",
      onUpdate: () => {
        el.textContent = formattedValue ?? String(Math.round(counter.current));
      },
    });
  }, [value, formattedValue, loading, reducedMotion]);

  return (
    <div className={cn(styles.root, className)}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        <span className={cn(styles.iconWrap, styles[tone])}>
          <Icon name={icon} size="sm" />
        </span>
      </div>
      {loading ? (
        <Skeleton height={32} width="60%" />
      ) : (
        <p ref={valueRef} className={styles.value}>
          {formattedValue ?? value ?? 0}
        </p>
      )}
      {trend && !loading && (
        <span className={cn(styles.trend, trend.direction === "up" ? styles.trendUp : styles.trendDown)}>
          <Icon name={trend.direction === "up" ? "arrow-up" : "arrow-down"} size="xs" />
          {trend.label}
        </span>
      )}
    </div>
  );
}
