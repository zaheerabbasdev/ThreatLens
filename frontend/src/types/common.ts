/** Shared primitive types used across the ThreatLens domain model. */

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

export interface DataSource {
  provider: string;
  fetchedAt: string;
  confidence: ConfidenceLevel;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PageRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  search?: string;
}

export type ISODateString = string;
