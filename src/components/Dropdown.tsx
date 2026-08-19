import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { cn } from "@/utils/cn";
import styles from "./Dropdown.module.css";

export interface DropdownItem {
  label: string;
  icon?: IconName;
  onSelect: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
  // The trigger's accessible name normally comes from its own visible
  // content. Set this when that content can lose its only text at some
  // breakpoint (e.g. a name hidden on mobile, leaving just an avatar/icon)
  // so the button still has a name for assistive tech.
  ariaLabel?: string;
}

export function Dropdown({ trigger, items, align = "end", ariaLabel }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Closing the menu unmounts its items. If one of them held keyboard focus
  // (e.g. after Escape or selecting an item), the browser drops focus to
  // <body> with nothing reachable to resume from — so we explicitly return
  // it to the trigger. Outside clicks are left alone: the browser already
  // places focus sensibly there (on whatever was clicked, or nowhere for a
  // mouse user who doesn't rely on focus tracking).
  function close(restoreFocus: boolean) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        close(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") close(true);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>
      {open && (
        <div role="menu" className={cn(styles.menu, styles[align])}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={cn(styles.item, item.tone === "danger" && styles.danger)}
              onClick={() => {
                item.onSelect();
                close(true);
              }}
            >
              {item.icon && <Icon name={item.icon} size="sm" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
