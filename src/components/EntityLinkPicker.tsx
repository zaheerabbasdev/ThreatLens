import { useEffect, useRef, type ReactNode } from "react";
import { Input } from "./Input";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Spinner } from "./Spinner";
import styles from "./EntityLinkPicker.module.css";

export interface EntityLinkPickerProps<T> {
  triggerLabel: string;
  searchPlaceholder: string;
  /** Controlled by the parent so it can gate its search query's `enabled`
   * on this — no point fetching a candidate list before the panel opens. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  items: T[] | undefined;
  isLoading: boolean;
  getId: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  onSelect: (item: T) => void;
  emptyMessage?: string;
}

/** Toggleable search-to-link control — used to attach existing incidents/indicators to an investigation. */
export function EntityLinkPicker<T>({
  triggerLabel,
  searchPlaceholder,
  open,
  onOpenChange,
  search,
  onSearchChange,
  items,
  isLoading,
  getId,
  renderItem,
  onSelect,
  emptyMessage = "No matches.",
}: EntityLinkPickerProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Move focus into the search box once the panel is revealed — this is a
  // direct response to the user's own click on the trigger button, not
  // page-load autofocus, so it doesn't steal focus unexpectedly.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function close() {
    onOpenChange(false);
    onSearchChange("");
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" iconLeft="plus" onClick={() => onOpenChange(true)}>
        {triggerLabel}
      </Button>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.searchRow}>
        <Input
          ref={inputRef}
          label={triggerLabel}
          hideLabel
          iconLeft="magnifying-glass"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button type="button" className={styles.closeButton} onClick={close} aria-label="Cancel">
          <Icon name="xmark" size="sm" />
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <Spinner size="sm" />
        </div>
      ) : !items || items.length === 0 ? (
        <p className={styles.empty}>{emptyMessage}</p>
      ) : (
        <ul className={styles.results}>
          {items.map((item) => (
            <li key={getId(item)}>
              <button
                type="button"
                className={styles.resultRow}
                onClick={() => {
                  onSelect(item);
                  close();
                }}
              >
                {renderItem(item)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
