import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/Modal";
import { Select } from "@/components/Select";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { AlertBanner } from "@/components/Alert";
import { useGenerateReport } from "@/api/useReports";
import { REPORT_TYPE_CONFIG, REPORT_TYPE_ORDER } from "@/constants/reportType";
import {
  REPORT_PERIOD_LABEL,
  REPORT_PERIOD_PRESETS,
  generateReportSchema,
  resolvePeriod,
  type GenerateReportInput,
} from "@/schemas/report";
import styles from "./GenerateReportModal.module.css";

export interface GenerateReportModalProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (reportId: string) => void;
}

export function GenerateReportModal({ open, onClose, onGenerated }: GenerateReportModalProps) {
  const generateReport = useGenerateReport();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GenerateReportInput>({
    resolver: zodResolver(generateReportSchema),
    defaultValues: { type: "security_summary", period: "7d", title: "" },
  });

  async function onSubmit(values: GenerateReportInput) {
    const { periodStart, periodEnd } = resolvePeriod(values.period);
    const report = await generateReport.mutateAsync({
      type: values.type,
      title: values.title,
      periodStart,
      periodEnd,
    });
    reset();
    onGenerated(report.id);
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Generate a report">
      <p className={styles.intro}>
        Reports are generated from data already in this workspace — nothing here is sent to an
        external service.
      </p>

      {generateReport.isError && (
        <AlertBanner tone="danger" title="Couldn't generate report" className={styles.formAlert}>
          {generateReport.error instanceof Error ? generateReport.error.message : "Something went wrong."}
        </AlertBanner>
      )}

      <form id="generate-report-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.fields}>
          <Select
            label="Report type"
            required
            error={errors.type?.message}
            options={REPORT_TYPE_ORDER.map((type) => ({ value: type, label: REPORT_TYPE_CONFIG[type].label }))}
            {...register("type")}
          />
          <Input
            label="Title"
            required
            placeholder="e.g. Weekly Security Summary"
            error={errors.title?.message}
            {...register("title")}
          />
          <Select
            label="Period"
            required
            hint="The report reflects data from the selected window through now."
            error={errors.period?.message}
            options={REPORT_PERIOD_PRESETS.map((preset) => ({ value: preset, label: REPORT_PERIOD_LABEL[preset] }))}
            {...register("period")}
          />
        </div>
      </form>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={handleClose} type="button">
          Cancel
        </Button>
        <Button type="submit" form="generate-report-form" loading={isSubmitting}>
          Generate report
        </Button>
      </div>
    </Modal>
  );
}
