import { Card, CardHeader, CardTitle } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/Badge";
import styles from "./IntegrationsTab.module.css";

export function IntegrationsTab() {
  return (
    <>
      <Card>
        <CardHeader className={styles.header}>
          <CardTitle>API access</CardTitle>
          <Badge tone="neutral">Planned for a later phase</Badge>
        </CardHeader>
        <EmptyState
          icon="key"
          title="API keys aren't available yet"
          description="Programmatic access to ThreatLens (API keys, scoped tokens, webhooks) ships once the backend is built. Nothing here is functional yet — this isn't a placeholder standing in for a working feature."
        />
      </Card>

      <Card>
        <CardHeader className={styles.header}>
          <CardTitle>AI provider settings</CardTitle>
          <Badge tone="neutral">Planned for a later phase</Badge>
        </CardHeader>
        <EmptyState
          icon="robot"
          title="AI provider configuration isn't available yet"
          description="Connecting a real OpenAI-compatible provider (behind ThreatLens's internal AIProvider abstraction) is a later build phase. The AI Assistant currently runs on mocked responses only."
        />
      </Card>
    </>
  );
}
