import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Alert, Severity, WorkflowStatus } from "@/types";
import { useAlertsList } from "@/api/useAlerts";
import { PageHeader } from "@/components/PageHeader";
import { ListToolbar } from "@/components/ListToolbar";
import { Table, type TableColumn } from "@/components/Table";
import { Pagination } from "@/components/Pagination";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/Badge";
import { formatRelativeTime, formatShortId } from "@/utils/format";
import { CONFIDENCE_LABEL } from "@/constants/severity";
import styles from "./AlertsList.module.css";

const PAGE_SIZE = 10;

export function AlertsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [status, setStatus] = useState<WorkflowStatus | "all">("all");

  const { data, isLoading, isError } = useAlertsList({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    severity: severity === "all" ? undefined : severity,
    status: status === "all" ? undefined : status,
  });

  const columns: TableColumn<Alert>[] = [
    {
      key: "id",
      header: "ID",
      width: "96px",
      render: (row) => <span className="mono">{formatShortId(row.id)}</span>,
    },
    {
      key: "title",
      header: "Title",
      render: (row) => <span className={styles.titleCell}>{row.title}</span>,
    },
    { key: "severity", header: "Severity", render: (row) => <SeverityBadge severity={row.severity} size="sm" /> },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} size="sm" /> },
    {
      key: "confidence",
      header: "Confidence",
      render: (row) => <Badge>{CONFIDENCE_LABEL[row.confidence]}</Badge>,
    },
    {
      key: "source",
      header: "Source",
      render: (row) => <span className={styles.source}>{row.source}</span>,
    },
    {
      key: "createdAt",
      header: "Detected",
      align: "right",
      render: (row) => <span className={styles.timestamp}>{formatRelativeTime(row.createdAt)}</span>,
    },
  ];

  return (
    <div className={styles.root}>
      <PageHeader title="Alerts" subtitle="Raw signals surfaced by detection sources, triaged into incidents." />

      <ListToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search alerts…"
        severity={severity}
        onSeverityChange={(v) => {
          setSeverity(v);
          setPage(1);
        }}
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
      />

      <Table
        columns={columns}
        data={data?.items ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        onRowClick={(row) => navigate(`/app/alerts/${row.id}`)}
        emptyIcon="bell"
        emptyTitle={isError ? "Couldn't load alerts" : "No alerts match these filters"}
        emptyDescription={
          isError
            ? "Something went wrong fetching alerts. Try again in a moment."
            : "Try adjusting your search or filters."
        }
      />

      {data && data.total > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
      )}
    </div>
  );
}
