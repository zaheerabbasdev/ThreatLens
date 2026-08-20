import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import styles from "./Tabs.module.css";

export interface TabItem {
  id: string;
  label: string;
  badge?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, onChange, className }: TabsProps) {
  // Sanitized for the same reason as FormField — see the comment there.
  const generatedId = useId();
  const baseId = `tabs-${generatedId.replace(/:/g, "")}`;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Roving-tabindex tabs (WAI-ARIA APG pattern): only the selected tab is in
  // the normal Tab order, and arrow/Home/End keys move both the selection
  // and DOM focus together. Updating `activeId` alone re-renders tabindex
  // but doesn't move focus off the button that was actually pressed — so
  // without an explicit `.focus()` call here, focus stays pinned to the
  // original tab and further arrow presses keep computing from its index,
  // making every tab past the second one unreachable by keyboard.
  function moveTo(index: number) {
    const next = items[index];
    if (!next) return;
    onChange(next.id);
    tabRefs.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveTo((index + 1) % items.length);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveTo((index - 1 + items.length) % items.length);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(items.length - 1);
        break;
    }
  }

  return (
    <div role="tablist" className={cn(styles.root, className)}>
      {items.map((item, index) => {
        const selected = item.id === activeId;
        return (
          <button
            key={item.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            id={`${baseId}-${item.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={cn(styles.tab, selected && styles.active)}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {item.label}
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}
