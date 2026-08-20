import { forwardRef, type SelectHTMLAttributes } from "react";
import { FormField } from "./FormField";
import { Icon } from "./Icon";
import { cn } from "@/utils/cn";
import styles from "./input.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  hideLabel?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, hint, hideLabel, required, disabled, className, ...rest }, ref) => {
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
            <select
              ref={ref}
              id={fieldId}
              disabled={disabled}
              required={required}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              {...rest}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size="sm" className={styles.icon} />
          </div>
        )}
      </FormField>
    );
  },
);
Select.displayName = "Select";
