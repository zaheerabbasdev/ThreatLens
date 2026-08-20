import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { FormField } from "./FormField";
import { Icon, type IconName } from "./Icon";
import { cn } from "@/utils/cn";
import styles from "./input.module.css";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
  iconLeft?: IconName;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, hint, hideLabel, iconLeft, required, disabled, className, type = "text", ...rest },
    ref,
  ) => {
    const [revealed, setRevealed] = useState(false);
    const isPassword = type === "password";
    const resolvedType = isPassword && revealed ? "text" : type;

    return (
      <FormField
        label={label}
        error={error}
        hint={hint}
        required={required}
        hideLabel={hideLabel}
        className={className}
      >
        {(fieldId, describedBy) => (
          <div className={cn(styles.control, error && styles.invalid, disabled && styles.disabled)}>
            {iconLeft && <Icon name={iconLeft} size="sm" className={styles.icon} />}
            <input
              ref={ref}
              id={fieldId}
              type={resolvedType}
              disabled={disabled}
              required={required}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              {...rest}
            />
            {isPassword && (
              <button
                type="button"
                className={styles.suffixButton}
                onClick={() => setRevealed((v) => !v)}
                aria-label={revealed ? "Hide password" : "Show password"}
              >
                <Icon name={revealed ? "eye-slash" : "eye"} size="sm" />
              </button>
            )}
          </div>
        )}
      </FormField>
    );
  },
);
Input.displayName = "Input";
