import { useId, type ReactNode } from "react";
import { Icon } from "./Icon";
import { cn } from "@/utils/cn";
import styles from "./FormField.module.css";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Keeps the label in the accessibility tree but hides it visually — for
   * compact toolbars where context (e.g. a placeholder) already conveys
   * purpose, without dropping the accessible name entirely. */
  hideLabel?: boolean;
  children: (fieldId: string, describedBy: string | undefined) => ReactNode;
  className?: string;
}

/** Shared label + help text + error wrapper used by every form control. */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  hideLabel,
  children,
  className,
}: FormFieldProps) {
  // React's useId() includes colons (e.g. ":r1:"), which are valid in HTML
  // ids but break any tooling that builds a CSS/attribute selector from the
  // id without escaping it (`:` opens a pseudo-class in CSS syntax) — that
  // bit real browser automation here, so ids are sanitized at the source.
  const generatedId = useId();
  const fieldId = htmlFor ?? `field-${generatedId.replace(/:/g, "")}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn(styles.root, className)}>
      <label htmlFor={fieldId} className={cn(styles.label, hideLabel && "visually-hidden")}>
        {label}
        {required && (
          <span aria-hidden="true" className={styles.required}>
            *
          </span>
        )}
      </label>
      {children(fieldId, describedBy)}
      {hint && !error && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          <Icon name="circle-exclamation" size="xs" />
          {error}
        </p>
      )}
    </div>
  );
}
