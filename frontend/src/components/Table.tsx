import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";
import { cn } from "@/utils/cn";
import styles from "./Table.module.css";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "right" | "center";
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  emptyIcon?: IconName;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (key: string) => void;
}

export function Table<T>({
  columns,
  data,
  getRowId,
  loading,
  emptyIcon = "inbox",
  emptyTitle = "No results",
  emptyDescription = "There's nothing to show here yet.",
  onRowClick,
  sortKey,
  sortDirection,
  onSortChange,
}: TableProps<T>) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, textAlign: col.align ?? "left" }}
                aria-sort={
                  sortKey === col.key
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                {col.sortable ? (
                  <button
                    type="button"
                    className={styles.sortButton}
                    onClick={() => onSortChange?.(col.key)}
                  >
                    {col.header}
                    <Icon
                      name={sortKey === col.key && sortDirection === "asc" ? "chevron-up" : "chevron-down"}
                      size="xs"
                      className={cn(styles.sortIcon, sortKey === col.key && styles.sortActive)}
                    />
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {columns.map((col) => (
                  <td key={col.key}>
                    <Skeleton height={14} />
                  </td>
                ))}
              </tr>
            ))}

          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className={styles.emptyCell}>
                <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          )}

          {!loading &&
            data.map((row) => (
              <tr
                key={getRowId(row)}
                className={cn(onRowClick && styles.clickableRow)}
                onClick={() => onRowClick?.(row)}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "button" : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align ?? "left" }}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
