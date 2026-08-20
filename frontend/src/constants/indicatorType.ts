import type { IndicatorType } from "@/types";
import type { IconName } from "@/components/Icon";

export const INDICATOR_TYPE_CONFIG: Record<IndicatorType, { label: string; icon: IconName }> = {
  ip: { label: "IP Address", icon: "globe" },
  domain: { label: "Domain", icon: "link" },
  url: { label: "URL", icon: "link" },
  hash: { label: "File Hash", icon: "fingerprint" },
};

export const INDICATOR_TYPE_ORDER: IndicatorType[] = ["ip", "domain", "url", "hash"];
