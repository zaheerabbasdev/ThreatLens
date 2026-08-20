import type { Indicator } from "@/types";

/** Every subtype carries a differently-named set of related-indicator ids. */
export function getRelatedIndicatorIds(indicator: Indicator): string[] {
  switch (indicator.type) {
    case "ip":
      return indicator.relatedDomainIds;
    case "domain":
      return [...indicator.relatedIpIds, ...indicator.relatedUrlIds];
    case "url":
      return indicator.relatedIndicatorIds;
    case "hash":
      return [];
  }
}
