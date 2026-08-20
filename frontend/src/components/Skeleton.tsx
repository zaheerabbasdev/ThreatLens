import { cn } from "@/utils/cn";
import styles from "./Skeleton.module.css";

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: "sm" | "md" | "lg" | "pill";
  className?: string;
}

export function Skeleton({ width = "100%", height = 16, radius = "sm", className }: SkeletonProps) {
  return (
    <span
      className={cn(styles.root, styles[radius], className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
