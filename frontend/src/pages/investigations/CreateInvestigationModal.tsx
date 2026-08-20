import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";
import { AlertBanner } from "@/components/Alert";
import { useCreateInvestigation } from "@/api/useInvestigations";
import { createInvestigationSchema, type CreateInvestigationInput } from "@/schemas/investigation";
import styles from "./CreateInvestigationModal.module.css";

export interface CreateInvestigationModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (investigationId: string) => void;
}

export function CreateInvestigationModal({ open, onClose, onCreated }: CreateInvestigationModalProps) {
  const createInvestigation = useCreateInvestigation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInvestigationInput>({ resolver: zodResolver(createInvestigationSchema) });

  async function onSubmit(values: CreateInvestigationInput) {
    const investigation = await createInvestigation.mutateAsync(values);
    reset();
    onCreated(investigation.id);
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Open a new investigation">
      <p className={styles.intro}>
        Start a case to correlate one or more incidents and indicators under a shared working
        theory.
      </p>

      {createInvestigation.isError && (
        <AlertBanner tone="danger" title="Couldn't create investigation" className={styles.formAlert}>
          {createInvestigation.error instanceof Error
            ? createInvestigation.error.message
            : "Something went wrong."}
        </AlertBanner>
      )}

      <form id="create-investigation-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.fields}>
          <Input
            label="Title"
            required
            placeholder="e.g. Finance-targeted phishing infrastructure cluster"
            error={errors.title?.message}
            {...register("title")}
          />
          <Textarea
            label="What are you investigating?"
            required
            rows={4}
            placeholder="Summarize the working theory and why these signals might be connected…"
            error={errors.description?.message}
            {...register("description")}
          />
        </div>
      </form>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={handleClose} type="button">
          Cancel
        </Button>
        <Button type="submit" form="create-investigation-form" loading={isSubmitting}>
          Open investigation
        </Button>
      </div>
    </Modal>
  );
}
