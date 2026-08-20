import { initials } from "@/utils/format";
import { seedToColor } from "@/utils/avatar";
import { cn } from "@/utils/cn";
import styles from "./Avatar.module.css";

export interface AvatarProps {
  name: string;
  seed: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Deterministic, initials-based avatar — no external avatar service call,
 * no photo required. Same seed always renders the same color (spec §8/§48
 * asset rules: deterministic avatars, no third-party identity leakage).
 */
export function Avatar({ name, seed, size = "md", className }: AvatarProps) {
  const color = seedToColor(seed);
  return (
    <span
      className={cn(styles.root, styles[size], className)}
      style={{ backgroundColor: `${color}26`, color, borderColor: `${color}55` }}
      aria-hidden="true"
    >
      {initials(name) || "?"}
    </span>
  );
}
