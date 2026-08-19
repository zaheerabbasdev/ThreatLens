import type { IconName } from "@/components/Icon";
import { StatusPage } from "./StatusPage";

export interface ComingSoonProps {
  feature: string;
  phase: string;
  icon: IconName;
  description?: string;
}

/**
 * Shared stub for routes not yet built in this increment. Intentional and
 * on-brand — never a broken link or bare placeholder (spec §43 no
 * placeholder UI, §42 no dead UI).
 */
export function ComingSoon({ feature, phase, icon, description }: ComingSoonProps) {
  return (
    <StatusPage
      icon={icon}
      eyebrow={phase}
      title={`${feature} is on the way`}
      description={
        description ??
        `This workspace is scheduled for a later build phase. The navigation and layout are already in place — the full ${feature.toLowerCase()} experience is next.`
      }
      primaryAction={{ label: "Back to dashboard", to: "/app/dashboard" }}
    />
  );
}
