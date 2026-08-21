import { forwardRef, useEffect, useRef, useState, type ChangeEvent, type SelectHTMLAttributes } from "react";
import { FormField } from "./FormField";
import { Icon } from "./Icon";
import { cn } from "@/utils/cn";
import styles from "./Select.module.css";

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
  ({ label, options, error, hint, hideLabel, required, disabled, className, value, defaultValue, onChange, ...rest }, ref) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const initialValue = String(value ?? defaultValue ?? options[0]?.value ?? "");
    const [selectedValue, setSelectedValue] = useState(initialValue);
    const [open, setOpen] = useState(false);
    const selected = options.find((option) => option.value === String(value ?? selectedValue)) ?? options[0];

    useEffect(() => {
      function closeOnOutside(event: MouseEvent) {
        if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
      }
      document.addEventListener("mousedown", closeOnOutside);
      return () => document.removeEventListener("mousedown", closeOnOutside);
    }, []);

    function choose(nextValue: string) {
      setSelectedValue(nextValue);
      setOpen(false);
      onChange?.({ target: { name: rest.name, value: nextValue }, currentTarget: { name: rest.name, value: nextValue } } as ChangeEvent<HTMLSelectElement>);
    }

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
          <div ref={rootRef} className={cn(styles.root, disabled && styles.disabled)}>
            <select
              ref={ref}
              id={fieldId}
              className={styles.native}
              tabIndex={-1}
              aria-label={label}
              disabled={disabled}
              required={required}
              value={selected?.value ?? ""}
              onChange={(event) => choose(event.target.value)}
              {...rest}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={cn(styles.trigger, error && styles.invalid)}
              disabled={disabled}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-describedby={describedBy}
              onClick={() => setOpen((current) => !current)}
            >
              <span>{selected?.label ?? "Select an option"}</span>
              <Icon name="chevron-down" size="sm" className={styles.icon} />
            </button>
            {open && (
              <div className={styles.menu} role="listbox" aria-label={label}>
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={option.value === selected?.value}
                    className={cn(styles.option, option.value === selected?.value && styles.selected)}
                    onClick={() => choose(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </FormField>
    );
  },
);
Select.displayName = "Select";
