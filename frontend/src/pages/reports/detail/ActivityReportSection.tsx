import { useMemo } from "react";
import { Table, type TableColumn } from "@/components/Table";
import { Badge } from "@/components/Badge";
import { useAuditList } from "@/api/useAudit";
import { formatDateTime } from "@/utils/format";
import type { AuditLog } from "@/types";
import styles from "./ReportSection.module.css";

export function ActivityReportSection({ periodStart, periodEnd }: { periodStart: string; periodEnd: string }) {
  const { data, isLoading } = useAuditList({ pageSize: 200 });

  const eventsInPeriod = useMemo(() => {
    if (!data) return [];
    const start = new Date(periodStart).getTime();
    const end = new Date(periodEnd).getTime();
    return data.items.filter((log) => {
      const t = new Date(log.timestamp).getTime();
      return t >= start && t <= end;
    });
  }, [data, periodStart, periodEnd]);

  const columns: TableColumn<AuditLog>[] = [
    { key: "actor", header: "Actor", render: (row) => row.actorName },
    { key: "action", header: "Action", render: (row) => <span className="mono">{row.action}</span> },
    { key: "resource", header: "Resource", render: (row) => row.resourceType },
    {
      key: "result",
      header: "Result",
      render: (row) => (
        <Badge tone={row.result === "success" ? "success" : "danger"}>{row.result}</Badge>
      ),
    },
    { key: "timestamp", header: "When", align: "right", render: (row) => formatDateTime(row.timestamp) },
  ];

  return (
    <div className={styles.root}>
      <Table
        columns={columns}
        data={eventsInPeriod}
        getRowId={(row) => row.id}
        loading={isLoading}
        emptyIcon="clipboard-list"
        emptyTitle="No activity in this period"
        emptyDescription="No audited actions were recorded within the report's date range."
      />
    </div>
  );
}
