import type { PageRequest, PaginatedResult } from "@/types";

/** Simulates network latency so loading states are exercised realistically. */
export function delay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function paginate<T>(items: T[], params?: PageRequest): PaginatedResult<T> {
  const page = params?.page && params.page > 0 ? params.page : 1;
  const pageSize = params?.pageSize && params.pageSize > 0 ? params.pageSize : 10;
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}
