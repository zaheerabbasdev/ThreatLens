import { Button } from "./Button";
import styles from "./Pagination.module.css";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className={styles.root}>
      <span className={styles.summary}>
        Showing <strong>{start}–{end}</strong> of <strong>{total}</strong>
      </span>
      <div className={styles.controls}>
        <Button
          variant="ghost"
          size="sm"
          iconLeft="chevron-left"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Prev
        </Button>
        <span className={styles.pageIndicator}>
          Page {page} of {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          iconRight="chevron-right"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
