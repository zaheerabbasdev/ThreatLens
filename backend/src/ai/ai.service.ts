import { randomUUID } from "node:crypto";
import { NotFoundError, ServiceUnavailableError, TooManyRequestsError } from "../errors/AppError.js";
import type { AIProvider } from "./aiProvider.js";
import { AIProviderError } from "./aiProvider.js";
import { aiCostTracker } from "./costTracker.js";
import { env } from "../config/env.js";
import type { IncidentRepository } from "../repositories/incident.repository.js";
import type { RecommendationRepository } from "../repositories/recommendation.repository.js";
import type { AIAnalysisRepository } from "../repositories/aiAnalysis.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { AuditService } from "../audit/audit.service.js";
import type { AIAnalysis, AIAssistantMessage, Recommendation, RecommendationStatus } from "../types/ai.js";
import { logger } from "../utils/logger.js";

const MODEL_LABEL_DISCLAIMER =
  "AI-generated — assistive only. Not a substitute for analyst judgment; verify against " +
  "deterministic evidence before acting (spec §52).";

/**
 * Ties the AIProvider abstraction to real org data, persistence, cost
 * control, and audit logging. This is the ONLY layer that decides what
 * context reaches a prompt (data minimization, spec §53) and what happens
 * to a model's output afterward (cache it, persist it, audit it) — the
 * provider itself is stateless per call.
 */
export class AIService {
  constructor(
    /** null when OPENAI_API_KEY isn't configured — see requireProvider(). */
    private readonly provider: AIProvider | null,
    private readonly incidents: IncidentRepository,
    private readonly recommendations: RecommendationRepository,
    private readonly analyses: AIAnalysisRepository,
    private readonly users: UserRepository,
    private readonly audit: AuditService,
  ) {}

  private requireProvider(): AIProvider {
    if (!this.provider) {
      throw new ServiceUnavailableError(
        "AI features aren't configured for this deployment (no OPENAI_API_KEY set).",
      );
    }
    return this.provider;
  }

  /** Spend-shaped cap (spec §59/§60) — independent of the route-level request-frequency rate limiter; see rateLimit.ts's comment on createAIRateLimit. */
  private assertWithinDailyCap(organizationId: string): void {
    if (aiCostTracker.requestsInLast24h(organizationId) >= env.AI_DAILY_REQUEST_LIMIT_PER_ORG) {
      throw new TooManyRequestsError(
        "This organization has reached its daily AI request limit. Try again tomorrow, or contact an admin.",
      );
    }
  }

  async askAssistant(organizationId: string, userId: string, message: string, incidentId?: string): Promise<AIAssistantMessage> {
    this.assertWithinDailyCap(organizationId);
    const provider = this.requireProvider();

    let incidentContext: { id: string; title: string; description: string; status: string; severity: string } | undefined;
    if (incidentId) {
      const incident = await this.incidents.getById(organizationId, incidentId);
      // Object-level check, same as everywhere else: an incidentId from
      // another org silently gets no context rather than a 404 here —
      // the assistant just answers without it, since a wrong/foreign ID
      // in a chat message isn't itself an error worth surfacing.
      if (incident) {
        incidentContext = { id: incident.id, title: incident.title, description: incident.description, status: incident.status, severity: incident.severity };
      }
    }

    const result = await this.runProvider(organizationId, userId, "answerQuestion", () =>
      provider.answerQuestion({ question: message, incidentContext }),
    );

    return {
      id: randomUUID(),
      role: "assistant",
      content: result.answer,
      createdAt: new Date().toISOString(),
      relatedIncidentId: incidentId,
    };
  }

  async analyzeIncident(organizationId: string, userId: string, incidentId: string, forceRegenerate = false): Promise<AIAnalysis> {
    if (!forceRegenerate) {
      const cached = await this.analyses.getByIncident(organizationId, incidentId);
      if (cached) return cached;
    }

    const incident = await this.incidents.getById(organizationId, incidentId);
    if (!incident) throw new NotFoundError("The requested incident was not found.");

    this.assertWithinDailyCap(organizationId);
    const provider = this.requireProvider();

    await this.audit.record({
      organizationId,
      actorId: userId,
      actorName: (await this.users.findById(userId))?.name ?? "Unknown",
      action: "AI_ANALYSIS_REQUESTED",
      resourceType: "incident",
      resourceId: incidentId,
      result: "success",
      severity: "info",
    });

    const result = await this.runProvider(organizationId, userId, "analyzeIncident", () =>
      provider.analyzeIncident({
        incident: {
          id: incident.id,
          title: incident.title,
          description: incident.description,
          severity: incident.severity,
          status: incident.status,
          affectedAssets: incident.affectedAssets,
          mitreTechniqueIds: incident.mitreTechniqueIds,
        },
      }),
    );

    const analysis: AIAnalysis = {
      id: randomUUID(),
      organizationId,
      incidentId,
      summary: result.summary,
      keyFindings: result.keyFindings,
      suggestedMitreTechniqueIds: result.suggestedMitreTechniqueIds,
      generatedAt: new Date().toISOString(),
      modelLabel: `${provider.label} (${env.OPENAI_MODEL})`,
      disclaimer: MODEL_LABEL_DISCLAIMER,
    };
    const saved = await this.analyses.save(analysis);

    await this.audit.record({
      organizationId,
      actorId: userId,
      actorName: (await this.users.findById(userId))?.name ?? "Unknown",
      action: "AI_ANALYSIS_COMPLETED",
      resourceType: "incident",
      resourceId: incidentId,
      result: "success",
      severity: "info",
    });

    return saved;
  }

  async generateRecommendations(organizationId: string, userId: string, incidentId: string): Promise<Recommendation[]> {
    const incident = await this.incidents.getById(organizationId, incidentId);
    if (!incident) throw new NotFoundError("The requested incident was not found.");

    this.assertWithinDailyCap(organizationId);
    const provider = this.requireProvider();

    const result = await this.runProvider(organizationId, userId, "generateRecommendations", () =>
      provider.generateRecommendations({
        incident: { id: incident.id, title: incident.title, description: incident.description, severity: incident.severity, status: incident.status },
      }),
    );

    const created = await Promise.all(
      result.recommendations.map((r) =>
        this.recommendations.create({
          id: randomUUID(),
          organizationId,
          incidentId,
          title: r.title,
          description: r.description,
          status: "pending",
          generatedBy: "ai",
        }),
      ),
    );

    await this.audit.record({
      organizationId,
      actorId: userId,
      actorName: (await this.users.findById(userId))?.name ?? "Unknown",
      action: "RECOMMENDATION_CREATED",
      resourceType: "incident",
      resourceId: incidentId,
      result: "success",
      severity: "info",
    });

    return created;
  }

  async listRecommendations(organizationId: string, incidentId: string): Promise<Recommendation[]> {
    return this.recommendations.listByIncident(organizationId, incidentId);
  }

  /**
   * Human-in-the-loop (spec §57/§58): the only way a recommendation's
   * status ever changes from "pending" — no automatic transition exists
   * anywhere in this codebase. Route-level `requirePermission
   * ("recommendations:approve")` already restricts who can call this;
   * this method is the deterministic backend validation spec §57 requires
   * alongside that permission check.
   */
  async reviewRecommendation(
    organizationId: string,
    reviewerId: string,
    recommendationId: string,
    status: Extract<RecommendationStatus, "approved" | "rejected">,
  ): Promise<Recommendation> {
    const updated = await this.recommendations.review(organizationId, recommendationId, status, reviewerId);
    if (!updated) throw new NotFoundError("The requested recommendation was not found.");

    const reviewer = await this.users.findById(reviewerId);
    await this.audit.record({
      organizationId,
      actorId: reviewerId,
      actorName: reviewer?.name ?? "Unknown",
      action: status === "approved" ? "RECOMMENDATION_APPROVED" : "RECOMMENDATION_REJECTED",
      resourceType: "recommendation",
      resourceId: recommendationId,
      result: "success",
      severity: "medium",
    });

    return updated;
  }

  /** Wraps every provider call with cost tracking and safe error translation — never lets a raw provider/network error reach a controller. */
  private async runProvider<T>(
    organizationId: string,
    userId: string,
    operation: string,
    call: () => Promise<{ output: T; tokensUsed?: number; durationMs: number }>,
  ): Promise<T> {
    try {
      const result = await call();
      aiCostTracker.record({
        organizationId,
        userId,
        provider: this.provider?.label ?? "unknown",
        operation,
        tokensUsed: result.tokensUsed,
        durationMs: result.durationMs,
        succeeded: true,
      });
      return result.output;
    } catch (err) {
      aiCostTracker.record({
        organizationId,
        userId,
        provider: this.provider?.label ?? "unknown",
        operation,
        durationMs: 0,
        succeeded: false,
      });
      if (err instanceof AIProviderError) {
        logger.error({ err, organizationId, operation }, "AI provider call failed");
        throw new ServiceUnavailableError("The AI provider couldn't complete this request. Please try again.");
      }
      throw err;
    }
  }
}
