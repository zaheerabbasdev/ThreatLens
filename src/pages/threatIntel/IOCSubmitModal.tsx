import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/Modal";
import { Select } from "@/components/Select";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";
import { AlertBanner } from "@/components/Alert";
import { useSubmitIOC } from "@/api/useIOC";
import { INDICATOR_TYPE_CONFIG, INDICATOR_TYPE_ORDER } from "@/constants/indicatorType";
import { iocSubmissionSchema, type IOCSubmissionFormInput } from "@/schemas/ioc";
import type { Indicator } from "@/types";
import styles from "./IOCSubmitModal.module.css";

export interface IOCSubmitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: (indicator: Indicator) => void;
}

export function IOCSubmitModal({ open, onClose, onSubmitted }: IOCSubmitModalProps) {
  const submitIOC = useSubmitIOC();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IOCSubmissionFormInput>({
    resolver: zodResolver(iocSubmissionSchema),
    defaultValues: { type: "ip", value: "", notes: "" },
  });

  async function onSubmit(values: IOCSubmissionFormInput) {
    const indicator = await submitIOC.mutateAsync({
      type: values.type,
      value: values.value,
      notes: values.notes,
    });
    reset();
    onSubmitted(indicator);
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Submit an indicator">
      <p className={styles.intro}>
        Submit an IP, domain, URL, or file hash for enrichment. Newly submitted indicators start
        unverified until analyzed.
      </p>

      {submitIOC.isError && (
        <AlertBanner tone="danger" title="Submission failed" className={styles.formAlert}>
          {submitIOC.error instanceof Error ? submitIOC.error.message : "Something went wrong."}
        </AlertBanner>
      )}

      <form id="ioc-submit-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.fields}>
          <Select
            label="Indicator type"
            required
            error={errors.type?.message}
            options={INDICATOR_TYPE_ORDER.map((type) => ({
              value: type,
              label: INDICATOR_TYPE_CONFIG[type].label,
            }))}
            {...register("type")}
          />
          <Input
            label="Value"
            required
            placeholder="e.g. 185.220.101.47, evil-domain.com, or a file hash"
            error={errors.value?.message}
            {...register("value")}
          />
          <Textarea
            label="Notes (optional)"
            rows={3}
            placeholder="Any context that helps an analyst triage this — where you saw it, why it's suspicious…"
            error={errors.notes?.message}
            {...register("notes")}
          />
        </div>
      </form>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={handleClose} type="button">
          Cancel
        </Button>
        <Button type="submit" form="ioc-submit-form" loading={isSubmitting}>
          Submit indicator
        </Button>
      </div>
    </Modal>
  );
}
