import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Avatar } from "@/components/Avatar";
import { Textarea } from "@/components/Textarea";
import { Button } from "@/components/Button";
import { useAddIncidentNote } from "@/api/useIncidents";
import { usePermission } from "@/hooks/usePermission";
import { formatRelativeTime } from "@/utils/format";
import { incidentNoteSchema, type IncidentNoteInput } from "@/schemas/incident";
import type { IncidentNote } from "@/types";
import styles from "./IncidentNotes.module.css";

export function IncidentNotes({ incidentId, notes }: { incidentId: string; notes: IncidentNote[] }) {
  const canWrite = usePermission("incidents:write");
  const addNote = useAddIncidentNote(incidentId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncidentNoteInput>({ resolver: zodResolver(incidentNoteSchema) });

  async function onSubmit(values: IncidentNoteInput) {
    await addNote.mutateAsync(values.content);
    reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyst notes</CardTitle>
      </CardHeader>

      {canWrite && (
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
          <Textarea
            label="Add a note"
            hideLabel
            placeholder="Add a note for the rest of the team…"
            rows={3}
            error={errors.content?.message}
            {...register("content")}
          />
          <div className={styles.formActions}>
            <Button type="submit" size="sm" loading={isSubmitting}>
              Add note
            </Button>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <EmptyState icon="note-sticky" title="No notes yet" description="Analyst notes and context will appear here." />
      ) : (
        <ul className={styles.list}>
          {notes.map((note) => (
            <li key={note.id} className={styles.item}>
              <Avatar name={note.authorName} seed={note.authorId} size="sm" />
              <div className={styles.content}>
                <div className={styles.itemHeader}>
                  <span className={styles.author}>{note.authorName}</span>
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
