export type { AuthService, LoginInput, RegisterInput, ChangePasswordInput } from "./auth.service";
export type {
  IncidentService,
  IncidentListParams,
  IncidentSummary,
  AddIncidentNoteInput,
} from "./incident.service";
export type { AlertService, AlertListParams, AlertSummary } from "./alert.service";
export type { ThreatService, TopTechnique } from "./threat.service";
export type { IOCService, IOCSubmissionInput, IOCListParams } from "./ioc.service";
export type { UserService, UserListParams, UpdateProfileInput } from "./user.service";
export type { AIService } from "./ai.service";
export type { ReportService, CreateReportInput } from "./report.service";
export type { AuditService, AuditListParams, RecordAuditEntryInput } from "./audit.service";
export type { GraphService } from "./graph.service";
export type { MitreService, MitreTechniqueListParams } from "./mitre.service";
export type {
  InvestigationService,
  InvestigationListParams,
  CreateInvestigationInput,
  AddInvestigationNoteInput,
} from "./investigation.service";

import { services as mockServices } from "./mock";
import { services as apiServices } from "./api";

/**
 * The one composition root every consumer should import from (Phase 12).
 * Resolved once, at module load, based on `VITE_API_BASE_URL` — unset
 * (the default) keeps the app on mock services exactly as every phase
 * before Phase 12 behaved; set it to point at a running backend to use the
 * real `Api*Service` implementations (falling back to mocks for anything
 * not yet ported — see services/api/index.ts). No component, hook, or
 * test that already imports `services` needs to know which one is active.
 */
export const services = import.meta.env["VITE_API_BASE_URL"] ? apiServices : mockServices;
