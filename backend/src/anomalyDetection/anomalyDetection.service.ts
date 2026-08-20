import { randomUUID } from "node:crypto";
import { NotFoundError, ServiceUnavailableError } from "../errors/AppError.js";
import type { SecurityEventRepository } from "../repositories/securityEvent.repository.js";
import type { UserRepository } from "../repositories/user.repository.js";
import type { AuditService } from "../audit/audit.service.js";
import type { SecurityEvent } from "../types/securityEvent.js";
import type { PaginatedResult } from "../types/common.js";
import type { AnomalyDetectionOutput, AnomalyDetectionProvider } from "./anomalyProvider.js";
import { AnomalyProviderError } from "./anomalyProvider.js";
import { computeFeatures } from "./featureExtraction.js";
import type { IngestEventInput } from "./anomalyDetection.schemas.js";
import { logger } from "../utils/logger.js";

export interface AnomalyDetectionResult {
  userId: string;
  windowHours: number;
  featuresObserved: ReturnType<typeof computeFeatures>;
  result: AnomalyDetectionOutput;
}

export class AnomalyDetectionService {
  constructor(
    private readonly events: SecurityEventRepository,
    private readonly users: UserRepository,
    private readonly audit: AuditService,
    /** null when ML_SERVICE_URL isn't configured — analyze() then fails with a clean 503, same posture as AIService/IOCService (spec §40's provider-unavailable handling generalized to Phase 8). */
    private readonly provider: AnomalyDetectionProvider | null,
  ) {}

  async ingest(organizationId: string, input: IngestEventInput): Promise<SecurityEvent> {
    const event: SecurityEvent = {
      id: randomUUID(),
      organizationId,
      userId: input.userId,
      type: input.type,
      description: input.description,
      severity: input.severity,
      sourceIp: input.sourceIp,
      isNewLocation: input.isNewLocation,
      authFailed: input.authFailed,
      isDownload: input.isDownload,
      endpoint: input.endpoint,
      timestamp: input.timestamp ?? new Date().toISOString(),
    };
    return this.events.create(event);
  }

  async list(organizationId: string, page: number, pageSize: number): Promise<PaginatedResult<SecurityEvent>> {
    const { items, total } = await this.events.list(organizationId, page, pageSize);
    return { items, total, page, pageSize };
  }

  /**
   * Scores one user's recent behavior against their own history
   * (spec §42). `targetUserId` is validated against the caller's own
   * organization first — same object-level-authorization rule as every
   * other cross-referenced ID in this codebase (spec §19/§20): a userId
   * from another org gets an identical 404, not a 403 that would confirm
   * the ID exists elsewhere.
   */
  async analyze(organizationId: string, actorUserId: string, targetUserId: string, windowHours: number): Promise<AnomalyDetectionResult> {
    const targetUser = await this.users.findById(targetUserId);
    if (!targetUser || targetUser.organizationId !== organizationId) {
      throw new NotFoundError("The requested user was not found.");
    }

    if (!this.provider) {
      throw new ServiceUnavailableError("Anomaly detection isn't configured for this deployment (no ML_SERVICE_URL set).");
    }

    const history = await this.events.listForUser(organizationId, targetUserId);
    const features = computeFeatures(history, windowHours);

    let output: AnomalyDetectionOutput;
    try {
      const { output: providerOutput } = await this.provider.detect(features);
      output = providerOutput;
    } catch (err) {
      if (err instanceof AnomalyProviderError) {
        logger.error({ err, organizationId, targetUserId }, "Anomaly detection provider call failed");
        throw new ServiceUnavailableError("The anomaly detection service couldn't complete this request. Please try again.");
      }
      throw err;
    }

    const actor = await this.users.findById(actorUserId);
    await this.audit.record({
      organizationId,
      actorId: actorUserId,
      actorName: actor?.name ?? "Unknown",
      action: "ANOMALY_DETECTED",
      resourceType: "user",
      resourceId: targetUserId,
      result: "success",
      // Reflects what was FOUND, not the outcome of the check itself — an
      // audit entry recording "we looked and found something concerning"
      // is itself a medium-severity event, same reasoning as
      // RECOMMENDATION_APPROVED in ai.service.ts.
      severity: output.isAnomaly ? "medium" : "info",
    });

    return { userId: targetUserId, windowHours, featuresObserved: features, result: output };
  }
}
