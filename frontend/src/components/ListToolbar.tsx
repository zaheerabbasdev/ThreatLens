import type { Severity, WorkflowStatus } from "@/types";
import { SEVERITY_CONFIG, SEVERITY_ORDER } from "@/constants/severity";
import { STATUS_CONFIG, STATUS_ORDER } from "@/constants/status";
import { Input } from "./Input";
import { Select } from "./Select";
import styles from "./ListToolbar.module.css";

export interface ListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Omit both severity props for lists whose items don't carry a severity (e.g. Investigations). */
  severity?: Severity | "all";
  onSeverityChange?: (value: Severity | "all") => void;
  status: WorkflowStatus | "all";
  onStatusChange: (value: WorkflowStatus | "all") => void;
}

/** Shared search + severity + status filter bar for list pages (Incidents, Alerts, Investigations). */
export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  severity,
  onSeverityChange,
  status,
  onStatusChange,
}: ListToolbarProps) {
  return (
    <div className={styles.root}>
      <div className={styles.search}>
        <Input
          label="Search"
          hideLabel
          iconLeft="magnifying-glass"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {onSeverityChange && (
        <div className={styles.filter}>
          <Select
            label="Severity"
            hideLabel
            value={severity ?? "all"}
            onChange={(e) => onSeverityChange(e.target.value as Severity | "all")}
            options={[
              { value: "all", label: "All severities" },
              ...SEVERITY_ORDER.map((s) => ({ value: s, label: SEVERITY_CONFIG[s].label })),
            ]}
          />
        </div>
      )}
      <div className={styles.filter}>
        <Select
          label="Status"
          hideLabel
          value={status}
          onChange={(e) => onStatusChange(e.target.value as WorkflowStatus | "all")}
          options={[
            { value: "all", label: "All statuses" },
            ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_CONFIG[s].label })),
          ]}
        />
      </div>
    </div>
  );
}
