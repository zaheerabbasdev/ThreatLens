import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";
import { cn } from "@/utils/cn";
import styles from "./Button.module.css";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      iconLeft,
      iconRight,
      fullWidth,
      disabled,
      className,
      children,
      type = "button",
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          styles.root,
          styles[variant],
          styles[size],
          fullWidth && styles.fullWidth,
          loading && styles.loading,
          className,
        )}
        {...rest}
      >
        {loading ? (
          // aria-busy on the button already communicates the loading state to
          // assistive tech; a nested status/live-region here would just
          // duplicate that and muddy the button's accessible name.
          <Icon name="circle-notch" spin size="sm" />
        ) : (
          iconLeft && <Icon name={iconLeft} size={size === "lg" ? "md" : "sm"} />
        )}
        <span className={styles.label}>{children}</span>
        {!loading && iconRight && <Icon name={iconRight} size={size === "lg" ? "md" : "sm"} />}
      </button>
    );
  },
);
Button.displayName = "Button";
