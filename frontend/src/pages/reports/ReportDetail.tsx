import { Link, useParams } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/Button";
import { useReport } from "@/api/useReports";
import { REPORT_TYPE_CONFIG } from "@/constants/reportType";
import { ReportHeaderCard } from "./detail/ReportHeaderCard";
import { SecuritySummarySection } from "./detail/SecuritySummarySection";
import { IncidentReportSection } from "./detail/IncidentReportSection";
import { ThreatIntelligenceSection } from "./detail/ThreatIntelligenceSection";
import { RiskReportSection } from "./detail/RiskReportSection";
import { ActivityReportSection } from "./detail/ActivityReportSection";
import styles from "./ReportDetail.module.css";

export function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: report, isLoading, isError } = useReport(id);

  if (isLoading) {
    return (
      <div className={styles.root}>
        <Skeleton height={32} width="40%" />
        <Skeleton height={200} />
        <Skeleton height={280} />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <EmptyState
        icon="file-lines"
        title="Report not found"
        description="This report doesn't exist or may have been removed."
        action={
          <Link to="/app/reports">
            <Button variant="secondary">Back to Reports</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className={styles.root}>
      {/* The page-level heading stays generic (the report type) — the
          specific report title gets its own, distinct heading inside
          ReportHeaderCard below, rather than repeating identical text in
          two <h1> elements. */}
      <PageHeader
        title={REPORT_TYPE_CONFIG[report.type].label}
        breadcrumbs={[
          { label: "Reports", path: "/app/reports" },
          { label: REPORT_TYPE_CONFIG[report.type].label },
        ]}
      />

      <ReportHeaderCard report={report} />

      {report.type === "security_summary" && <SecuritySummarySection />}
      {report.type === "incident_report" && (
        <IncidentReportSection periodStart={report.periodStart} periodEnd={report.periodEnd} />
      )}
      {report.type === "threat_intelligence" && <ThreatIntelligenceSection />}
      {report.type === "risk_report" && <RiskReportSection />}
      {report.type === "activity_report" && (
        <ActivityReportSection periodStart={report.periodStart} periodEnd={report.periodEnd} />
      )}
    </div>
  );
}
