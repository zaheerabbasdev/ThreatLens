import { Schema, model } from "mongoose";
import { randomUUID } from "node:crypto";
import type { ConfidenceLevel, Severity } from "../../types/common.js";
import type { IndicatorType, HashAlgorithm } from "../../types/indicator.js";

export interface DataSourceDoc {
  provider: string;
  fetchedAt: Date;
  confidence: ConfidenceLevel;
}

/**
 * One flat schema for all four indicator types rather than Mongoose
 * discriminators. The type-specific fields (country/asn for IPs, registrar
 * for domains, domain/path for URLs, algorithm/fileName for hashes) are all
 * declared but optional, and which ones are actually populated is
 * determined by `type` — Zod already enforces the exact per-type shape at
 * the API boundary (threatIntel/ioc.schemas.ts), so this schema's job is
 * "every field is a declared, typed column," not re-deriving polymorphism
 * MongoDB doesn't need and discriminators would add real complexity for.
 */
export interface IndicatorDoc {
  _id: string;
  organizationId: string;
  type: IndicatorType;
  value: string;
  riskScore: number;
  severity: Severity;
  confidence: ConfidenceLevel;
  firstSeen: Date;
  lastSeen: Date;
  tags: string[];
  relatedIncidentIds: string[];
  sources: DataSourceDoc[];
  submittedBy?: string;
  notes?: string;
  // ip
  country?: string;
  countryCode?: string;
  asn?: string;
  asnOrg?: string;
  isTor?: boolean;
  relatedDomainIds?: string[];
  // domain
  registrar?: string;
  registeredAt?: Date;
  relatedIpIds?: string[];
  relatedUrlIds?: string[];
  // url
  domain?: string;
  path?: string;
  isMalwareHost?: boolean;
  relatedIndicatorIds?: string[];
  // hash
  algorithm?: HashAlgorithm;
  fileName?: string;
  fileType?: string;
  fileSizeBytes?: number;
  malwareFamily?: string;
}

const SEVERITIES = ["critical", "high", "medium", "low", "info"];
const CONFIDENCE_LEVELS = ["confirmed", "high", "medium", "low", "unverified"];
const TYPES = ["ip", "domain", "url", "hash"];

const sourceSchema = new Schema<DataSourceDoc>(
  { provider: String, fetchedAt: Date, confidence: { type: String, enum: CONFIDENCE_LEVELS } },
  { _id: false },
);

/**
 * Indexes (spec §11 explicitly calls out indicator value/type/hash/IP/
 * domain by name): `organizationId` (load-bearing for every query),
 * compound `{organizationId, type}` and `{organizationId, severity}` for
 * the documented list filters, and `{organizationId, value}` — indicator
 * lookup/search by its literal value (IP, domain, URL, or hash) is the
 * single most common query shape for a threat-intel collection.
 */
const indicatorSchema = new Schema<IndicatorDoc>(
  {
    _id: { type: String, default: () => randomUUID() },
    organizationId: { type: String, required: true },
    type: { type: String, required: true, enum: TYPES },
    value: { type: String, required: true, maxlength: 2048 },
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    severity: { type: String, required: true, enum: SEVERITIES },
    confidence: { type: String, required: true, enum: CONFIDENCE_LEVELS },
    firstSeen: { type: Date, required: true },
    lastSeen: { type: Date, required: true },
    tags: { type: [String], default: [] },
    relatedIncidentIds: { type: [String], default: [] },
    sources: { type: [sourceSchema], default: [] },
    submittedBy: { type: String },
    notes: { type: String, maxlength: 2000 },
    country: String,
    countryCode: String,
    asn: String,
    asnOrg: String,
    isTor: Boolean,
    relatedDomainIds: [String],
    registrar: String,
    registeredAt: Date,
    relatedIpIds: [String],
    relatedUrlIds: [String],
    domain: String,
    path: String,
    isMalwareHost: Boolean,
    relatedIndicatorIds: [String],
    algorithm: { type: String, enum: ["md5", "sha1", "sha256"] },
    fileName: String,
    fileType: String,
    fileSizeBytes: Number,
    malwareFamily: String,
  },
  { timestamps: false }, // firstSeen/lastSeen already cover this collection's timestamps
);

indicatorSchema.index({ organizationId: 1, type: 1 });
indicatorSchema.index({ organizationId: 1, severity: 1 });
indicatorSchema.index({ organizationId: 1, value: 1 });
indicatorSchema.index({ organizationId: 1, lastSeen: -1 });

export const IndicatorModel = model<IndicatorDoc>("Indicator", indicatorSchema);
