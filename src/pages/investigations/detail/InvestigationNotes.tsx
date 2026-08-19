import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Avatar } from "@/components/Avatar";
import { Textarea } from "@/components/Textarea";
import { Checkbox } from "@/components/Checkbox";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { useAddInvestigationNote } from "@/api/useInvestigations";
import { usePermission } from "@/hooks/usePermission";
import { formatRelativeTime } from "@/utils/format";
import { investigationNoteSchema, type InvestigationNoteInput } from "@/schemas/investigation";
import { cn } from "@/utils/cn";
import type { InvestigationNote } from "@/types";
import styles from "./InvestigationNotes.module.css";

export function InvestigationNotes({
  investigationId,
  notes,
}: {
  investigationId: string;
  notes: InvestigationNote[];
}) {
  const canWrite = usePermission("investigations:write");
  const addNote = useAddInvestigationNote(investigationId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvestigationNoteInput>({
    resolver: zodResolver(investigationNoteSchema),
    defaultValues: { isFinding: false },
  });

  async function onSubmit(values: InvestigationNoteInput) {
    await addNote.mutateAsync({ content: values.content, isFinding: values.isFinding ?? false });
    reset({ content: "", isFinding: false });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes &amp; findings</CardTitle>
      </CardHeader>

      {canWrite && (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <Textarea
            label="Add a note"
            hideLabel
            placeholder="Record evidence, reasoning, or a conclusion…"
            rows={3}
            error={errors.content?.message}
            {...register("content")}
          />
          <div className={styles.formActions}>
            <Checkbox label="Mark as a key finding" {...register("isFinding")} />
            <Button type="submit" size="sm" loading={isSubmitting}>
              Add note
            </Button>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <EmptyState
          icon="note-sticky"
          title="No notes yet"
          description="Evidence, reasoning, and key findings will appear here."
        />
      ) : (
        <ul className={styles.list}>
          {notes.map((note) => (
            <li key={note.id} className={cn(styles.item, note.isFinding && styles.findingItem)}>
              <Avatar name={note.authorName} seed={note.authorId} size="sm" />
              <div className={styles.content}>
                <div className={styles.itemHeader}>
                  <span className={styles.authorGroup}>
                    <span className={styles.author}>{note.authorName}</span>
                    {note.isFinding && (
                      <span className={styles.findingTag}>
                        <Icon name="lightbulb" size="xs" />
                        Key finding
                      </span>
                    )}
                  </span>
                  <span className={styles.time}>{formatRelativeTime(note.createdAt)}</span>
                </div>
                <p className={styles.text}>{note.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
