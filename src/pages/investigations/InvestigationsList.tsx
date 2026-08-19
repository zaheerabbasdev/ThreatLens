import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Investigation, WorkflowStatus } from "@/types";
import { useInvestigationsList } from "@/api/useInvestigations";
import { useUsersList } from "@/api/useUsers";
import { PageHeader } from "@/components/PageHeader";
import { ListToolbar } from "@/components/ListToolbar";
import { Table, type TableColumn } from "@/components/Table";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { usePermission } from "@/hooks/usePermission";
import { formatRelativeTime } from "@/utils/format";
import { CreateInvestigationModal } from "./CreateInvestigationModal";
import styles from "./InvestigationsList.module.css";

const PAGE_SIZE = 10;

export function InvestigationsList() {
  const navigate = useNavigate();
  const canWrite = usePermission("investigations:write");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<WorkflowStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError } = useInvestigationsList({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status: status === "all" ? undefined : status,
  });
  const { data: usersData } = useUsersList();

  const analystName = useMemo(() => {
    const byId = new Map(usersData?.items.map((u) => [u.id, u.name]));
    return (id: string) => byId.get(id) ?? "Unknown";
  }, [usersData]);

  const columns: TableColumn<Investigation>[] = [
    {
      key: "title",
      header: "Title",
      render: (row) => <span className={styles.titleCell}>{row.title}</span>,
    },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} size="sm" /> },
    {
      key: "lead",
      header: "Lead analyst",
      render: (row) => (
        <span className={styles.lead}>
          <Avatar name={analystName(row.leadAnalystId)} seed={row.leadAnalystId} size="sm" />
          {analystName(row.leadAnalystId)}
        </span>
      ),
    },
    {
      key: "links",
      header: "Linked",
      render: (row) => (
        <span className={styles.links}>
          <Badge>{row.relatedIncidentIds.length} incident{row.relatedIncidentIds.length === 1 ? "" : "s"}</Badge>
          <Badge>{row.relatedIndicatorIds.length} indicator{row.relatedIndicatorIds.length === 1 ? "" : "s"}</Badge>
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
        title="Investigations"
        subtitle="Case files correlating evidence across one or more incidents."
        actions={
          canWrite && (
            <Button iconLeft="plus" onClick={() => setCreateOpen(true)}>
              New investigation
            </Button>
          )
        }
      />

      <ListToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search investigations…"
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
        onRowClick={(row) => navigate(`/app/investigations/${row.id}`)}
        emptyIcon="magnifying-glass"
        emptyTitle={isError ? "Couldn't load investigations" : "No investigations match these filters"}
        emptyDescription={
          isError
            ? "Something went wrong fetching investigations. Try again in a moment."
            : "Try adjusting your search or filters."
        }
      />

      {data && data.total > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
      )}

      <CreateInvestigationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => navigate(`/app/investigations/${id}`)}
      />
    </div>
  );
}
