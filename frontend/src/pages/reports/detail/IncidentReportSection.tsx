import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Table, type TableColumn } from "@/components/Table";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { useIncidentsList } from "@/api/useIncidents";
import { formatDateTime, formatShortId } from "@/utils/format";
import type { Incident } from "@/types";
import styles from "./ReportSection.module.css";

export function IncidentReportSection({ periodStart, periodEnd }: { periodStart: string; periodEnd: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useIncidentsList({ pageSize: 100 });

  const incidentsInPeriod = useMemo(() => {
    if (!data) return [];
    const start = new Date(periodStart).getTime();
    const end = new Date(periodEnd).getTime();
    return data.items.filter((i) => {
      const t = new Date(i.createdAt).getTime();
      return t >= start && t <= end;
    });
  }, [data, periodStart, periodEnd]);

  const columns: TableColumn<Incident>[] = [
    { key: "id", header: "ID", width: "96px", render: (row) => <span className="mono">{formatShortId(row.id)}</span> },
    { key: "title", header: "Title", render: (row) => row.title },
    { key: "severity", header: "Severity", render: (row) => <SeverityBadge severity={row.severity} size="sm" /> },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} size="sm" /> },
    { key: "createdAt", header: "Opened", align: "right", render: (row) => formatDateTime(row.createdAt) },
  ];

  return (
    <div className={styles.root}>
      <Table
        columns={columns}
        data={incidentsInPeriod}
        getRowId={(row) => row.id}
        loading={isLoading}
        onRowClick={(row) => navigate(`/app/incidents/${row.id}`)}
        emptyIcon="fire"
        emptyTitle="No incidents in this period"
        emptyDescription="No incidents were opened within the report's date range."
      />
    </div>
  );
}
