import { Card, CardHeader, CardTitle } from "./Card";
import { EmptyState } from "./EmptyState";
import { formatDateTime } from "@/utils/format";
import styles from "./Timeline.module.css";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  actor?: string;
}

export interface TimelineProps {
  events: TimelineEvent[];
  emptyDescription?: string;
}

/** Shared chronological event list — used by Incident and Investigation workspaces alike. */
export function Timeline({
  events,
  emptyDescription = "Events will appear here as activity happens.",
}: TimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      {events.length === 0 ? (
        <EmptyState icon="clock" title="No timeline events yet" description={emptyDescription} />
      ) : (
        <ol className={styles.list}>
          {events.map((event, index) => (
            <li key={event.id} className={styles.item}>
              <span className={styles.marker} aria-hidden="true">
                <span className={styles.dot} />
                {index < events.length - 1 && <span className={styles.line} />}
              </span>
              <div className={styles.content}>
                <div className={styles.itemHeader}>
                  <p className={styles.itemTitle}>{event.title}</p>
                  <time className={styles.itemTime} dateTime={event.timestamp}>
                    {formatDateTime(event.timestamp)}
                  </time>
                </div>
                <p className={styles.itemDescription}>{event.description}</p>
                {event.actor && <p className={styles.itemActor}>— {event.actor}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
