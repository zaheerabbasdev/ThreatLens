import type { ConfidenceLevel, DataSource, ISODateString, Severity } from "./common";

export type IndicatorType = "ip" | "domain" | "url" | "hash";

export type HashAlgorithm = "md5" | "sha1" | "sha256";

interface IndicatorBase {
  id: string;
  type: IndicatorType;
  value: string;
  riskScore: number;
  severity: Severity;
  confidence: ConfidenceLevel;
  firstSeen: ISODateString;
  lastSeen: ISODateString;
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
  registeredAt?: ISODateString;
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

export type Indicator = IPIndicator | DomainIndicator | URLIndicator | HashIndicator;
