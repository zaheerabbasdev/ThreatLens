import { useState } from "react";
import type { AuditLog, AuditResult } from "@/types";
import { useAuditList } from "@/api/useAudit";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Table, type TableColumn } from "@/components/Table";
import { Pagination } from "@/components/Pagination";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Icon } from "@/components/Icon";
import { formatDateTime } from "@/utils/format";
import styles from "./AuditLogsList.module.css";

const PAGE_SIZE = 15;

export function AuditLogsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<AuditResult | "all">("all");

  const { data, isLoading, isError } = useAuditList({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    result: result === "all" ? undefined : result,
  });

  const columns: TableColumn<AuditLog>[] = [
    {
      key: "actor",
      header: "Actor",
      render: (row) => <span className={styles.actor}>{row.actorName}</span>,
    },
    {
      key: "action",
      header: "Action",
      render: (row) => <span className={styles.action}>{row.action.replaceAll("_", " ").toLowerCase()}</span>,
    },
    {
      key: "resource",
      header: "Resource",
      render: (row) => (
        <span className={styles.resource}>
          {row.resourceType}
          {row.resourceId ? ` · ${row.resourceId}` : ""}
        </span>
      ),
    },
    {
      key: "ipAddress",
      header: "IP address",
      render: (row) => <span className={styles.ip}>{row.ipAddress}</span>,
    },
    {
      key: "result",
      header: "Result",
      render: (row) => (
        <span className={row.result === "success" ? styles.resultSuccess : styles.resultFailure}>
          <Icon name={row.result === "success" ? "circle-check" : "circle-xmark"} size="xs" />
          {row.result === "success" ? "Success" : "Failure"}
        </span>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      render: (row) => <SeverityBadge severity={row.severity} size="sm" />,
    },
    {
      key: "timestamp",
      header: "Time",
      align: "right",
      render: (row) => <span className={styles.timestamp}>{formatDateTime(row.timestamp)}</span>,
    },
  ];

  return (
    <div className={styles.root}>
      <PageHeader
        title="Audit Logs"
        subtitle="A record of security-sensitive actions taken across this workspace."
      />

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Input
            label="Search audit logs"
            hideLabel
            iconLeft="magnifying-glass"
            placeholder="Search by actor, action, or resource…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className={styles.filter}>
          <Select
            label="Filter by result"
            hideLabel
            value={result}
            onChange={(e) => {
              setResult(e.target.value as AuditResult | "all");
              setPage(1);
            }}
            options={[
              { value: "all", label: "All results" },
              { value: "success", label: "Success" },
              { value: "failure", label: "Failure" },
            ]}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={data?.items ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        emptyIcon="clipboard-list"
        emptyTitle={isError ? "Couldn't load audit logs" : "No audit events match these filters"}
        emptyDescription={
          isError
            ? "Something went wrong fetching audit logs. Try again in a moment."
            : "Try adjusting your search or filters."
        }
      />

      {data && data.total > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
      )}
    </div>
  );
}
