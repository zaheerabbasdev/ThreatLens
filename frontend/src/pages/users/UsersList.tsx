import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AccountStatus, Role, User } from "@/types";
import { useUsersList } from "@/api/useUsers";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Table, type TableColumn } from "@/components/Table";
import { Pagination } from "@/components/Pagination";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import { AccountStatusBadge } from "@/components/AccountStatusBadge";
import { Icon } from "@/components/Icon";
import { ROLE_LABEL } from "@/constants/roles";
import { ACCOUNT_STATUS_CONFIG, ACCOUNT_STATUS_ORDER } from "@/constants/accountStatus";
import { formatRelativeTime } from "@/utils/format";
import styles from "./UsersList.module.css";

const PAGE_SIZE = 10;
const ROLE_ORDER: Role[] = ["super_admin", "security_admin", "security_analyst", "viewer"];

export function UsersList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [status, setStatus] = useState<AccountStatus | "all">("all");

  const { data, isLoading, isError } = useUsersList({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    role: role === "all" ? undefined : role,
    status: status === "all" ? undefined : status,
  });

  const columns: TableColumn<User>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <span className={styles.identity}>
          <Avatar name={row.name} seed={row.avatarSeed} size="sm" />
          <span className={styles.identityText}>
            <span className={styles.name}>{row.name}</span>
            <span className={styles.email}>{row.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <Badge tone={row.role === "super_admin" || row.role === "security_admin" ? "accent" : "neutral"}>
          {ROLE_LABEL[row.role]}
        </Badge>
      ),
    },
    { key: "status", header: "Status", render: (row) => <AccountStatusBadge status={row.status} size="sm" /> },
    {
      key: "mfa",
      header: "MFA",
      render: (row) => (
        <span className={row.mfaEnabled ? styles.mfaOn : styles.mfaOff}>
          <Icon name={row.mfaEnabled ? "shield-halved" : "circle-exclamation"} size="xs" />
          {row.mfaEnabled ? "On" : "Off"}
        </span>
      ),
    },
    {
      key: "lastActiveAt",
      header: "Last active",
      align: "right",
      render: (row) => (
        <span className={styles.timestamp}>
          {row.lastActiveAt ? formatRelativeTime(row.lastActiveAt) : "Never"}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.root}>
      <PageHeader
        title="Users"
        subtitle="Everyone with access to this workspace, their role, and account status."
      />

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Input
            label="Search users"
            hideLabel
            iconLeft="magnifying-glass"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className={styles.filter}>
          <Select
            label="Filter by role"
            hideLabel
            value={role}
            onChange={(e) => {
              setRole(e.target.value as Role | "all");
              setPage(1);
            }}
            options={[
              { value: "all", label: "All roles" },
              ...ROLE_ORDER.map((r) => ({ value: r, label: ROLE_LABEL[r] })),
            ]}
          />
        </div>
        <div className={styles.filter}>
          <Select
            label="Filter by status"
            hideLabel
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as AccountStatus | "all");
              setPage(1);
            }}
            options={[
              { value: "all", label: "All statuses" },
              ...ACCOUNT_STATUS_ORDER.map((s) => ({ value: s, label: ACCOUNT_STATUS_CONFIG[s].label })),
            ]}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={data?.items ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        onRowClick={(row) => navigate(`/app/users/${row.id}`)}
        emptyIcon="users"
        emptyTitle={isError ? "Couldn't load users" : "No users match these filters"}
        emptyDescription={
          isError
            ? "Something went wrong fetching users. Try again in a moment."
            : "Try adjusting your search or filters."
        }
      />

      {data && data.total > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
      )}
    </div>
  );
}
