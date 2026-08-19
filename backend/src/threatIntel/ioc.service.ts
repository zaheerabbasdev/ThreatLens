import { randomUUID } from "node:crypto";
import { NotFoundError } from "../errors/AppError.js";
import type { IndicatorRepository, IndicatorListParams } from "../repositories/indicator.repository.js";
import type { Indicator, HashAlgorithm } from "../types/indicator.js";
import type { PaginatedResult } from "../types/common.js";
import type { SubmitInput } from "./ioc.schemas.js";
import { logger } from "../utils/logger.js";

function hashAlgorithmFor(value: string): HashAlgorithm {
  if (value.length === 32) return "md5";
  if (value.length === 40) return "sha1";
  return "sha256"; // schema already rejected any other length
}

export class IOCService {
  constructor(private readonly indicators: IndicatorRepository) {}

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
}
