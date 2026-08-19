import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Incident, Severity, WorkflowStatus } from "@/types";
import { useIncidentsList } from "@/api/useIncidents";
import { useUsersList } from "@/api/useUsers";
import { PageHeader } from "@/components/PageHeader";
import { ListToolbar } from "@/components/ListToolbar";
import { Table, type TableColumn } from "@/components/Table";
import { Pagination } from "@/components/Pagination";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import { formatRelativeTime, formatShortId } from "@/utils/format";
import { CONFIDENCE_LABEL } from "@/constants/severity";
import styles from "./IncidentsList.module.css";

const PAGE_SIZE = 10;

export function IncidentsList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [status, setStatus] = useState<WorkflowStatus | "all">("all");

  const { data, isLoading, isError } = useIncidentsList({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    severity: severity === "all" ? undefined : severity,
    status: status === "all" ? undefined : status,
  });
  const { data: usersData } = useUsersList();

  const analystName = useMemo(() => {
    const byId = new Map(usersData?.items.map((u) => [u.id, u.name]));
    return (id?: string) => (id ? (byId.get(id) ?? "Unassigned") : "Unassigned");
  }, [usersData]);

  const columns: TableColumn<Incident>[] = [
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
      key: "assignee",
      header: "Assigned to",
      render: (row) => (
        <span className={styles.assignee}>
          <Avatar name={analystName(row.assignedAnalystId)} seed={row.assignedAnalystId ?? "unassigned"} size="sm" />
          {analystName(row.assignedAnalystId)}
        </span>
      ),
    },
    {
      key: "updatedAt",
      header: "Updated",
      align: "right",
      render: (row) => <span className={styles.timestamp}>{formatRelativeTime(row.updatedAt)}</span>,
    },
  ];

  return (
    <div className={styles.root}>
      <PageHeader
        title="Incidents"
        subtitle="Confirmed security incidents requiring investigation and response."
      />

      <ListToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search incidents…"
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
        onRowClick={(row) => navigate(`/app/incidents/${row.id}`)}
        emptyIcon="fire"
        emptyTitle={isError ? "Couldn't load incidents" : "No incidents match these filters"}
        emptyDescription={
          isError
            ? "Something went wrong fetching incidents. Try again in a moment."
            : "Try adjusting your search or filters."
        }
      />

      {data && data.total > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
      )}
    </div>
  );
}
