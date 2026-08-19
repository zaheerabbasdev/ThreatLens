import { forwardRef, type TextareaHTMLAttributes } from "react";
import { FormField } from "./FormField";
import { cn } from "@/utils/cn";
import styles from "./input.module.css";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, hideLabel, required, disabled, className, ...rest }, ref) => {
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
            <textarea
              ref={ref}
              id={fieldId}
              disabled={disabled}
              required={required}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              {...rest}
            />
          </div>
        )}
      </FormField>
    );
  },
);
Textarea.displayName = "Textarea";
