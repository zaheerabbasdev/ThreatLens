import type { ResponseAction } from "../types/responseAction.js";

export interface ActionExecutionResult {
  isSimulated: boolean;
  resultDescription: string;
}

/**
 * Same DI shape as AIProvider/ThreatIntelProvider/AnomalyDetectionProvider —
 * one abstraction, swappable implementation, nothing above this layer
 * hardcodes how an action actually gets carried out. Unlike those three,
 * there's no "not configured" 503 case here: a `SimulatedActionExecutor` is
 * always available, so requesting/executing a response action always works
 * in every deployment — it's the REAL EDR/firewall/IAM execution (Phase 12)
 * that's the optional, swappable piece.
 */
export interface ResponseActionExecutor {
  execute(action: ResponseAction): Promise<ActionExecutionResult>;
}

function describeTarget(action: ResponseAction): string {
  return action.target ? `"${action.target}"` : "the recommended remediation described above";
}

/**
 * The only executor that exists right now. Always returns
 * `isSimulated: true` — never claims to have touched a real firewall, EDR,
 * or IAM system, because it hasn't (CLAUDE.md: never fabricate a result).
 * Phase 12 ("integration") is where a real executor gets built and wired in
 * behind this same interface, with zero changes to responseWorkflow.
 * service.ts.
 */
export class SimulatedActionExecutor implements ResponseActionExecutor {
  async execute(action: ResponseAction): Promise<ActionExecutionResult> {
    return {
      isSimulated: true,
      resultDescription:
        `Simulated: recorded a decision to ${action.type.replace(/_/g, " ")} for ${describeTarget(action)}. ` +
        "No live EDR/firewall/IAM integration is configured for this deployment (real execution is Phase 12's " +
        "scope) — nothing was actually sent to an external system.",
    };
  }
}
