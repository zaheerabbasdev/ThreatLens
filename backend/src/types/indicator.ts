import type { ConfidenceLevel, Severity } from "./common.js";

export type IndicatorType = "ip" | "domain" | "url" | "hash";
export type HashAlgorithm = "md5" | "sha1" | "sha256";

export interface DataSource {
  provider: string;
  fetchedAt: string;
  confidence: ConfidenceLevel;
}

interface IndicatorBase {
  id: string;
  organizationId: string;
  type: IndicatorType;
  value: string;
  riskScore: number;
  severity: Severity;
  confidence: ConfidenceLevel;
  firstSeen: string;
  lastSeen: string;
  tags: string[];
  relatedIncidentIds: string[];
  sources: DataSource[];
  submittedBy?: string;
  notes?: string;
}

export interface IPIndicator extends IndicatorBase {
  type: "ip";
  country?: string;
  countryCode?: string;
  asn?: string;
  asnOrg?: string;
  isTor?: boolean;
  relatedDomainIds: string[];
}

export interface DomainIndicator extends IndicatorBase {
  type: "domain";
  registrar?: string;
  registeredAt?: string;
  relatedIpIds: string[];
  relatedUrlIds: string[];
}

export interface URLIndicator extends IndicatorBase {
  type: "url";
  domain: string;
  path: string;
  isMalwareHost: boolean;
  relatedIndicatorIds: string[];
}

export interface HashIndicator extends IndicatorBase {
  type: "hash";
  algorithm: HashAlgorithm;
  fileName?: string;
  fileType?: string;
  fileSizeBytes?: number;
  malwareFamily?: string;
}

/** Mirrors the frontend's discriminated union in src/types/indicator.ts, with `organizationId` added — same reasoning as Incident. */
export type Indicator = IPIndicator | DomainIndicator | URLIndicator | HashIndicator;
