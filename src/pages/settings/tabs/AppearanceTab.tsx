import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Icon } from "@/components/Icon";
import { Badge } from "@/components/Badge";
import styles from "./AppearanceTab.module.css";

export function AppearanceTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <div className={styles.option}>
        <div className={styles.optionIcon}>
          <Icon name="palette" size="md" />
        </div>
        <div className={styles.optionText}>
          <span className={styles.optionLabel}>
            Dark <Badge tone="accent">Active</Badge>
          </span>
          <p className={styles.optionHint}>
            ThreatLens uses a single dark, high-contrast theme by design — built for long shifts
            in a security operations context, not as a stylistic default. A light theme isn't
            planned.
          </p>
        </div>
      </div>
    </Card>
  );
}
