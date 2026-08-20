import { Icon } from "./Icon";
import styles from "./Spinner.module.css";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function Spinner({ size = "md", label = "Loading" }: SpinnerProps) {
  return (
    <span className={styles.root} role="status">
      <Icon
        name="circle-notch"
        spin
        size={size === "lg" ? "xl" : size === "sm" ? "sm" : "lg"}
        className={styles.icon}
      />
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
