import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Checkbox } from "@/components/Checkbox";
import { AlertBanner } from "@/components/Alert";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import styles from "./NotificationsTab.module.css";

const OPTIONS: { key: "criticalAlerts" | "incidentAssigned" | "weeklyDigest" | "productUpdates"; label: string; hint: string }[] = [
  {
    key: "criticalAlerts",
    label: "Critical and high severity alerts",
    hint: "Notify me as soon as a critical or high severity alert is triggered.",
  },
  {
    key: "incidentAssigned",
    label: "Incident assigned to me",
    hint: "Notify me when an incident is assigned to my account.",
  },
  {
    key: "weeklyDigest",
    label: "Weekly security digest",
    hint: "A weekly summary of incidents, alerts, and risk trends.",
  },
  {
    key: "productUpdates",
    label: "Product updates",
    hint: "Occasional news about new ThreatLens features.",
  },
];

export function NotificationsTab() {
  const { preferences, setPreference } = useNotificationPreferences();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification preferences</CardTitle>
      </CardHeader>

      <AlertBanner tone="info" title="Stored in this browser only" className={styles.alert}>
        There's no notification delivery system yet — these preferences are saved locally and
        aren't sent anywhere or shared across devices.
      </AlertBanner>

      <div className={styles.list}>
        {OPTIONS.map((option) => (
          <div key={option.key} className={styles.item}>
            <Checkbox
              label={option.label}
              checked={preferences[option.key]}
              onChange={(e) => setPreference(option.key, e.target.checked)}
            />
            <p className={styles.hint}>{option.hint}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
