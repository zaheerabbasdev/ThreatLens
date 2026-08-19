import { Link } from "react-router-dom";
import { Button } from "@/components/Button";
import { Icon, type IconName } from "@/components/Icon";
import styles from "./Landing.module.css";

const LIFECYCLE: string[] = [
  "Detect",
  "Enrich",
  "Correlate",
  "Analyze",
  "Explain",
  "Prioritize",
  "Respond",
  "Audit",
];

const FEATURES: { icon: IconName; title: string; description: string }[] = [
  {
    icon: "magnifying-glass-chart",
    title: "Indicator investigation",
    description: "Look up IPs, domains, URLs, and file hashes with reputation, confidence, and history in one view.",
  },
  {
    icon: "diagram-project",
    title: "Threat graph",
    description: "See how indicators, incidents, and techniques connect — not just isolated alerts.",
  },
  {
    icon: "chess-board",
    title: "MITRE ATT&CK mapping",
    description: "Every incident maps to concrete tactics and techniques, not vague labels.",
  },
  {
    icon: "wand-magic-sparkles",
    title: "AI-assisted analysis",
    description: "Plain-language explanations and recommendations — always labeled, always reviewed by a human.",
  },
  {
    icon: "gauge-high",
    title: "Deterministic risk scoring",
    description: "Risk scores are calculated from concrete factors, never left to a model to invent.",
  },
  {
    icon: "clipboard-list",
    title: "Full audit trail",
    description: "Every action — human or AI-assisted — is logged for accountability and review.",
  },
];

export function Landing() {
  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Threat Intelligence &amp; Response, built for lean teams</p>
        <h1 className={styles.headline}>
          Security operations, without the Security Operations Center.
        </h1>
        <p className={styles.subhead}>
          ThreatLens helps small and mid-sized organizations collect signals, investigate
          indicators, and respond to incidents — with AI that assists analysts, never replaces
          them.
        </p>
        <div className={styles.heroActions}>
          <Link to="/register">
            <Button size="lg" iconRight="arrow-right">
              Start free
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      <section className={styles.lifecycle} aria-label="Platform lifecycle">
        {LIFECYCLE.map((step, index) => (
          <div key={step} className={styles.lifecycleStep}>
            <span className={styles.lifecycleIndex}>{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.lifecycleLabel}>{step}</span>
          </div>
        ))}
      </section>

      <section className={styles.features}>
        {FEATURES.map((feature) => (
          <div key={feature.title} className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Icon name={feature.icon} size="md" />
            </div>
            <h2 className={styles.featureTitle}>{feature.title}</h2>
            <p className={styles.featureDescription}>{feature.description}</p>
          </div>
        ))}
      </section>

      <section className={styles.ctaBand}>
        <h2 className={styles.ctaTitle}>See it running in under a minute.</h2>
        <Link to="/register">
          <Button size="lg" iconRight="arrow-right">
            Create your workspace
          </Button>
        </Link>
      </section>
    </div>
  );
}
