/** Shared primitive types used across domain modules — mirrors the frontend's src/types/common.ts so the two layers speak the same vocabulary. */

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type ConfidenceLevel = "confirmed" | "high" | "medium" | "low" | "unverified";

export type WorkflowStatus =
  | "new"
  | "open"
  | "investigating"
  | "contained"
  | "resolved"
  | "closed"
  | "false_positive";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
