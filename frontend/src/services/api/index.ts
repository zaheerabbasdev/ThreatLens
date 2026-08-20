import { ApiAuthService } from "./auth.service";
import { ApiIncidentService } from "./incident.service";
import { ApiAlertService } from "./alert.service";
import { ApiIOCService } from "./ioc.service";
import { ApiUserService } from "./user.service";
import { ApiAIService } from "./ai.service";
import { ApiReportService } from "./report.service";
import { ApiAuditService } from "./audit.service";
import { ApiGraphService } from "./graph.service";
import { ApiMitreService } from "./mitre.service";
import { ApiInvestigationService } from "./investigation.service";
import { MockThreatService } from "../mock/threat.service.mock";

/**
 * Composition root for the REAL backend (Phase 12). Ported services call
 * the actual running API; `threat` stays on its mock implementation
 * because several of its methods (`getOrgRiskScore`, `getSystemHealth`,
 * `listActivityTimeline`, `listTopTechniques`) have no backend endpoint
 * yet — those are dashboard-aggregation views nothing in Phases 3-11 built,
 * not something this integration phase can wire up without inventing new
 * backend surface (out of scope for "connect existing pieces" — see
 * backend/README.md's Phase 12 section). `getIndicatorById`/
 * `getIndicatorsByIds` within `threat` specifically COULD reuse the real
 * `/ioc/:id` endpoint (see `ioc.service.ts`), but the interface is one
 * cohesive service — splitting it method-by-method would be more confusing
 * than clarifying, so the whole thing stays mocked until a real dashboard-
 * aggregation API exists to back all of it.
 *
 * Each subsequent increment replaces one more `Mock*Service` here with its
 * `Api*Service` counterpart; nothing outside this file changes when that
 * happens.
 */
export const services = {
  auth: new ApiAuthService(),
  incidents: new ApiIncidentService(),
  alerts: new ApiAlertService(),
  ioc: new ApiIOCService(),
  users: new ApiUserService(),
  ai: new ApiAIService(),
  reports: new ApiReportService(),
  audit: new ApiAuditService(),
  graph: new ApiGraphService(),
  mitre: new ApiMitreService(),
  investigations: new ApiInvestigationService(),
  // --- Not yet ported — see the module comment above.
  threat: new MockThreatService(),
};
