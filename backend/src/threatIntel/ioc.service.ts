import { randomUUID } from "node:crypto";
import { NotFoundError, ServiceUnavailableError } from "../errors/AppError.js";
import type { IndicatorRepository, IndicatorListParams } from "../repositories/indicator.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { Indicator, HashAlgorithm, DataSource } from "../types/indicator.js";
import type { PaginatedResult } from "../types/common.js";
import type { SubmitInput } from "./ioc.schemas.js";
import type { AuditService } from "../audit/audit.service.js";
import type { ThreatIntelProvider, ThreatIntelLookupOutput } from "./threatIntelProvider.js";
import { severityFromScore, highestConfidence } from "../utils/risk.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

function hashAlgorithmFor(value: string): HashAlgorithm {
  if (value.length === 32) return "md5";
  if (value.length === 40) return "sha1";
  return "sha256"; // schema already rejected any other length
}

export class IOCService {
  constructor(
    private readonly indicators: IndicatorRepository,
    private readonly users: UserRepository,
    private readonly audit: AuditService,
    /** Empty when no provider API keys are configured — enrichIndicator() then fails with a clean 503, same posture as AIService.requireProvider (spec §40). */
    private readonly providers: ThreatIntelProvider[] = [],
  ) {}

  async submit(organizationId: string, submittedBy: string, input: SubmitInput): Promise<Indicator> {
    const now = new Date().toISOString();
    const base = {
      id: randomUUID(),
      organizationId,
      value: input.value,
      // A freshly submitted, unenriched indicator starts at the bottom of
      // the scale — real scoring (correlation, external provider lookups)
      // is Phase 7/8, not invented here.
      riskScore: 0,
      severity: "info" as const,
      confidence: "unverified" as const,
      firstSeen: now,
      lastSeen: now,
      tags: [],
      relatedIncidentIds: [],
      sources: [],
      submittedBy,
      notes: input.notes,
    };

    let indicator: Indicator;
    switch (input.type) {
      case "ip":
        indicator = { ...base, type: "ip", relatedDomainIds: [] };
        break;
      case "domain":
        indicator = { ...base, type: "domain", relatedIpIds: [], relatedUrlIds: [] };
        break;
      case "url": {
        const url = new URL(input.value.includes("://") ? input.value : `https://${input.value}`);
        indicator = {
          ...base,
          type: "url",
          domain: url.hostname,
          path: url.pathname || "/",
          isMalwareHost: false,
          relatedIndicatorIds: [],
        };
        break;
      }
      case "hash":
        indicator = { ...base, type: "hash", algorithm: hashAlgorithmFor(input.value) };
        break;
    }

    const created = await this.indicators.create(indicator);
    logger.info(
      { organizationId, indicatorId: created.id, type: created.type, event: "ioc.submitted" },
      "IOC submitted",
    );
    const actor = await this.users.findById(submittedBy);
    await this.audit.record({
      organizationId,
      actorId: submittedBy,
      actorName: actor?.name ?? "Unknown",
      action: "IOC_SUBMITTED",
      resourceType: "indicator",
      resourceId: created.id,
      result: "success",
      severity: "info",
    });
    return created;
  }

  list(organizationId: string, params: IndicatorListParams): Promise<PaginatedResult<Indicator>> {
    return this.indicators.list(organizationId, params);
  }

  async getById(organizationId: string, id: string): Promise<Indicator> {
    const indicator = await this.indicators.getById(organizationId, id);
    if (!indicator) throw new NotFoundError("The requested indicator was not found.");
    return indicator;
  }

  /**
   * Queries every configured ThreatIntelProvider for this indicator and
   * folds the results in. Deterministic end-to-end (spec §39/§40): no AI
   * involved, riskScore/severity/confidence are recomputed by a fixed
   * formula from the provider outputs, never invented.
   */
  async enrichIndicator(organizationId: string, userId: string, id: string, force = false): Promise<Indicator> {
    const indicator = await this.getById(organizationId, id);

    if (this.providers.length === 0) {
      throw new ServiceUnavailableError(
        "Threat intelligence enrichment isn't configured for this deployment (no provider API keys set).",
      );
    }

    const staleAfterMs = env.IOC_ENRICHMENT_STALE_AFTER_HOURS * 60 * 60 * 1000;
    const now = Date.now();

    // "Stale data" (spec §40) has an explicit meaning here: don't re-query a
    // provider we already have a recent-enough opinion from, unless asked to.
    const providersToQuery = force
      ? this.providers
      : this.providers.filter((provider) => {
          const lastFetchedAt = indicator.sources
            .filter((s) => s.provider === provider.name)
            .map((s) => new Date(s.fetchedAt).getTime())
            .sort((a, b) => b - a)[0];
          return lastFetchedAt === undefined || now - lastFetchedAt >= staleAfterMs;
        });

    if (providersToQuery.length === 0) {
      logger.info({ organizationId, indicatorId: id }, "ioc.enrich: all configured providers still fresh, skipping");
      return indicator;
    }

    // Every provider is queried independently — one being down (spec §40:
    // "handle API failures") degrades only its own contribution, it never
    // fails the whole request or blocks the providers that did respond.
    const settled = await Promise.allSettled(
      providersToQuery.map((provider) => provider.lookup({ type: indicator.type, value: indicator.value })),
    );

    const fetchedAt = new Date().toISOString();
    const newSources: DataSource[] = [];
    const outputs: ThreatIntelLookupOutput[] = [];

    settled.forEach((result, i) => {
      const provider = providersToQuery[i]!;
      if (result.status === "fulfilled") {
        newSources.push({ provider: provider.name, fetchedAt, confidence: result.value.output.confidence });
        outputs.push(result.value.output);
      } else {
        logger.warn(
          { organizationId, indicatorId: id, provider: provider.name, err: result.reason },
          "ioc.enrich: provider lookup failed, skipping this provider",
        );
      }
    });

    if (newSources.length === 0) {
      // Every provider we actually queried failed at runtime — a transient
      // external problem, not "unconfigured." Return the indicator
      // unchanged rather than fabricate a result (spec §40).
      return indicator;
    }

    // Conservative aggregation: the worst score any source has EVER reported
    // wins, not just this call's. A provider that once flagged malicious
    // isn't quietly forgotten because a later lookup came back clean.
    // Providers disagreeing is never hidden — every individual opinion stays
    // visible in `sources[]`; riskScore is only a security-conservative
    // summary of them (spec §40: "never present external intelligence as
    // absolute truth" — this summary is explicitly that, a summary).
    const scoredOutputs = outputs.filter((o): o is ThreatIntelLookupOutput & { score: number } => o.score !== undefined);
    const bestNewScore = scoredOutputs.length > 0 ? Math.max(...scoredOutputs.map((o) => o.score)) : undefined;
    const riskScore = bestNewScore !== undefined ? Math.max(indicator.riskScore, bestNewScore) : indicator.riskScore;

    const patch: Partial<Indicator> = {
      sources: [...indicator.sources, ...newSources],
      riskScore,
      severity: severityFromScore(riskScore),
      confidence: highestConfidence([indicator.confidence, ...outputs.map((o) => o.confidence)]),
      lastSeen: fetchedAt,
      tags: Array.from(new Set([...indicator.tags, ...outputs.flatMap((o) => o.categories)])),
    };

    const updated = await this.indicators.update(organizationId, id, patch);
    if (!updated) throw new NotFoundError("The requested indicator was not found.");

    logger.info(
      { organizationId, indicatorId: id, providers: newSources.map((s) => s.provider), event: "ioc.enriched" },
      "IOC enriched",
    );
    const actor = await this.users.findById(userId);
    await this.audit.record({
      organizationId,
      actorId: userId,
      actorName: actor?.name ?? "Unknown",
      // Reuses the frontend's pre-existing "IOC_ANALYZED" action (src/types/
      // audit.ts) rather than inventing a near-duplicate — it was already
      // reserved for exactly this capability.
      action: "IOC_ANALYZED",
      resourceType: "indicator",
      resourceId: id,
      result: "success",
      severity: "info",
    });

    return updated;
  }
}
