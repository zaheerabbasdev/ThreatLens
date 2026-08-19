import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Indicator, IndicatorType, Severity } from "@/types";
import { useIOCList } from "@/api/useIOC";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Table, type TableColumn } from "@/components/Table";
import { Pagination } from "@/components/Pagination";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { formatRelativeTime, truncateMiddle } from "@/utils/format";
import { CONFIDENCE_LABEL, SEVERITY_CONFIG, SEVERITY_ORDER } from "@/constants/severity";
import { INDICATOR_TYPE_CONFIG, INDICATOR_TYPE_ORDER } from "@/constants/indicatorType";
import { usePermission } from "@/hooks/usePermission";
import { IOCSubmitModal } from "./IOCSubmitModal";
import styles from "./IOCOverview.module.css";

const PAGE_SIZE = 10;

export function IOCOverview() {
  const navigate = useNavigate();
  const canSubmit = usePermission("ioc:submit");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<IndicatorType | "all">("all");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  const { data, isLoading, isError } = useIOCList({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    type: type === "all" ? undefined : type,
    severity: severity === "all" ? undefined : severity,
  });

  const columns: TableColumn<Indicator>[] = [
    {
      key: "type",
      header: "Type",
      width: "120px",
      render: (row) => (
        <span className={styles.typeCell}>
          <Icon name={INDICATOR_TYPE_CONFIG[row.type].icon} size="sm" />
          {INDICATOR_TYPE_CONFIG[row.type].label}
        </span>
      ),
    },
    {
      key: "value",
      header: "Value",
      render: (row) => (
        <span className={styles.value} title={row.value}>
          {truncateMiddle(row.value, 22)}
        </span>
      ),
    },
    { key: "severity", header: "Severity", render: (row) => <SeverityBadge severity={row.severity} size="sm" /> },
    {
      key: "confidence",
      header: "Confidence",
      render: (row) => <Badge>{CONFIDENCE_LABEL[row.confidence]}</Badge>,
    },
    {
      key: "riskScore",
      header: "Risk",
      align: "right",
      render: (row) => <span className="mono">{row.riskScore}</span>,
    },
    {
      key: "lastSeen",
      header: "Last seen",
      align: "right",
      render: (row) => <span className={styles.timestamp}>{formatRelativeTime(row.lastSeen)}</span>,
    },
  ];

  return (
    <div className={styles.root}>
      <PageHeader
        title="IOC Overview"
        subtitle="Indicators of compromise collected across your organization's telemetry."
        actions={
          canSubmit && (
            <Button iconLeft="plus" onClick={() => setSubmitModalOpen(true)}>
              Submit indicator
            </Button>
          )
        }
      />

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Input
            label="Search"
            hideLabel
            iconLeft="magnifying-glass"
            placeholder="Search by value…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className={styles.filter}>
          <Select
            label="Type"
            hideLabel
            value={type}
            onChange={(e) => {
              setType(e.target.value as IndicatorType | "all");
              setPage(1);
            }}
            options={[
              { value: "all", label: "All types" },
              ...INDICATOR_TYPE_ORDER.map((t) => ({ value: t, label: INDICATOR_TYPE_CONFIG[t].label })),
            ]}
          />
        </div>
        <div className={styles.filter}>
          <Select
            label="Severity"
            hideLabel
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value as Severity | "all");
              setPage(1);
            }}
            options={[
              { value: "all", label: "All severities" },
              ...SEVERITY_ORDER.map((s) => ({ value: s, label: SEVERITY_CONFIG[s].label })),
            ]}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={data?.items ?? []}
        getRowId={(row) => row.id}
        loading={isLoading}
        onRowClick={(row) => navigate(`/app/threat-intel/${row.id}`)}
        emptyIcon="shield-halved"
        emptyTitle={isError ? "Couldn't load indicators" : "No indicators match these filters"}
        emptyDescription={
          isError
            ? "Something went wrong fetching indicators. Try again in a moment."
            : "Try adjusting your search or filters."
        }
      />

      {data && data.total > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
      )}

      <IOCSubmitModal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSubmitted={(indicator) => {
          setSubmitModalOpen(false);
          navigate(`/app/threat-intel/${indicator.id}`);
        }}
      />
    </div>
  );
}
