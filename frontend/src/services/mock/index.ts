import { MockAuthService } from "./auth.service.mock";
import { MockIncidentService } from "./incident.service.mock";
import { MockAlertService } from "./alert.service.mock";
import { MockThreatService } from "./threat.service.mock";
import { MockIOCService } from "./ioc.service.mock";
import { MockUserService } from "./user.service.mock";
import { MockAIService } from "./ai.service.mock";
import { MockReportService } from "./report.service.mock";
import { MockAuditService } from "./audit.service.mock";
import { MockGraphService } from "./graph.service.mock";
import { MockMitreService } from "./mitre.service.mock";
import { MockInvestigationService } from "./investigation.service.mock";

/**
 * Composition root for the service layer. Every service is depended on by
 * interface (see src/services/*.service.ts). Swapping to a real backend
 * later means replacing the instances constructed here with
 * `Api*Service` implementations — no other file needs to change.
 */
export const services = {
  auth: new MockAuthService(),
  incidents: new MockIncidentService(),
  alerts: new MockAlertService(),
  threat: new MockThreatService(),
  ioc: new MockIOCService(),
  users: new MockUserService(),
  ai: new MockAIService(),
  reports: new MockReportService(),
  audit: new MockAuditService(),
  graph: new MockGraphService(),
  mitre: new MockMitreService(),
  investigations: new MockInvestigationService(),
};
