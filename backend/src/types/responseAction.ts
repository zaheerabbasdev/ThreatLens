export type ResponseActionType =
  | "block_ip"
  | "block_domain"
  | "isolate_host"
  | "disable_user_account"
  | "force_password_reset"
  | "quarantine_file"
  /** Only ever set internally when a response action is created FROM an already-approved AI recommendation (spec §57/§58) — never a value a client submits directly, see responseWorkflow.schemas.ts. */
  | "recommended_action";

export type ResponseActionStatus = "pending_execution" | "executed" | "rejected";

/**
 * The RESPOND stage of the platform lifecycle (spec: DETECT→ENRICH→
 * CORRELATE→ANALYZE→EXPLAIN→PRIORITIZE→RESPOND→AUDIT). Two human gates by
 * design, matching CLAUDE.md's "critical actions require deterministic
 * backend validation and, where appropriate, human approval": one analyst
 * REQUESTS an action (`response:request`), a more privileged one
 * EXECUTES or REJECTS it (`response:execute`) — the same separation the
 * frontend's role matrix already draws for recommendation approval, reused
 * here for a non-AI, potentially destructive action.
 *
 * `isSimulated` is always `true` today — no real EDR/firewall/IAM
 * integration exists yet (that's explicitly Phase 12's scope, "integration"
 * in the phase list). Executing an action here means "recorded as decided
 * and would have been sent to an external system," never "an external
 * system was actually touched." See responseWorkflow/actionExecutor.ts.
 */
export interface ResponseAction {
  id: string;
  organizationId: string;
  incidentId: string;
  type: ResponseActionType;
  /** The IP/hostname/username/domain/file hash being acted on — absent for `recommended_action`, whose target is described in `description` instead. */
  target?: string;
  description: string;
  status: ResponseActionStatus;
  /** Set when this action originated from an approved AI recommendation via POST /response-actions/apply-recommendation/:id. */
  recommendationId?: string;
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  /** Populated once status is "executed" — see ResponseActionExecutor. */
  executionResult?: string;
  isSimulated?: boolean;
}
