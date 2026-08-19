import type { IconName } from "@/components/Icon";
import type { Permission } from "@/constants/roles";

export interface StubRouteConfig {
  path: string;
  feature: string;
  icon: IconName;
  permission?: Permission;
}

/**
 * Config for routes rendered by the shared <ComingSoon> stub. Empty now that
 * every page in the master prompt's Phase 1 (frontend) page list is built —
 * kept in place, rather than removed, so a future phase that needs to stub
 * out a not-yet-built page (e.g. a Phase 2+ feature surfaced early in nav)
 * has a ready-made pattern instead of reinventing one.
 */
export const STUB_ROUTES: StubRouteConfig[] = [];
