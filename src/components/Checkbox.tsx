import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { Icon } from "./Icon";
import { cn } from "@/utils/cn";
import styles from "./Checkbox.module.css";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  label: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, ...rest }, ref) => {
    // Sanitized for the same reason as FormField — see the comment there.
    const generatedId = useId();
    const id = `field-${generatedId.replace(/:/g, "")}`;
    return (
      <div className={cn(styles.root, className)}>
        <label className={styles.label} htmlFor={id}>
          <span className={styles.box}>
            <input ref={ref} id={id} type="checkbox" className={styles.input} {...rest} />
            <Icon name="check" size="xs" className={styles.check} />
          </span>
          {label}
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";
