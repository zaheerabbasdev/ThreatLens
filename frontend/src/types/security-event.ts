import type { ISODateString, Severity } from "./common";

export type SecurityEventType =
  | "authentication"
  | "network"
  | "file_access"
  | "configuration_change"
  | "anomaly";

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  description: string;
  severity: Severity;
  sourceIp?: string;
  userId?: string;
  timestamp: ISODateString;
}
