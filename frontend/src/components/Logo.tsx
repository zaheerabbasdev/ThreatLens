import { cn } from "@/utils/cn";
import styles from "./Logo.module.css";

export interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

export function Logo({ size = 28, withWordmark = true, className }: LogoProps) {
  return (
    <span className={cn(styles.root, className)}>
      <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="ThreatLens">
        <path
          d="M32 6 L54 14 V30 C54 44.5 45 54 32 59 C19 54 10 44.5 10 30 V14 Z"
          fill="#10151C"
          stroke="var(--accent-500)"
          strokeWidth="2.25"
        />
        <path
          d="M32 15 L46.5 20.5 V30.5 C46.5 40.5 40.5 47.6 32 51.2 C23.5 47.6 17.5 40.5 17.5 30.5 V20.5 Z"
          fill="none"
          stroke="var(--accent-400)"
          strokeWidth="1.5"
          opacity="0.55"
        />
        <circle cx="32" cy="30" r="7" fill="none" stroke="var(--accent-500)" strokeWidth="2.75" />
        <circle cx="32" cy="30" r="2.25" fill="var(--accent-500)" />
        <path
          d="M32 22.5 V16 M39.2 26.4 L44.9 23.1 M39.2 33.6 L44.9 36.9 M24.8 26.4 L19.1 23.1 M24.8 33.6 L19.1 36.9"
          stroke="var(--accent-500)"
          strokeWidth="1.75"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
      {withWordmark && <span className={styles.wordmark}>ThreatLens</span>}
    </span>
  );
}
