import type { Severity } from "./common.js";

export type SecurityEventType = "authentication" | "network" | "file_access" | "configuration_change" | "anomaly";

/** Mirrors the frontend's src/types/security-event.ts, with `organizationId` added — same reasoning as every other domain type. Raw behavioral telemetry (spec §42's feature inputs) is derived FROM a window of these, not stored as a feature vector itself — see anomalyDetection/featureExtraction.ts. */
export interface SecurityEvent {
  id: string;
  organizationId: string;
  userId?: string;
  type: SecurityEventType;
  description: string;
  severity: Severity;
  sourceIp?: string;
  /** True when sourceIp/geo doesn't match this user's recent history — computed at ingest time (deterministically, not inferred by the ML service), since the service only ever sees the finished feature vector. */
  isNewLocation?: boolean;
  /** Present only for type: "authentication" — did this attempt fail? */
  authFailed?: boolean;
  /** Present only for type: "file_access" with a download action. */
  isDownload?: boolean;
  /** The endpoint/resource path touched, when applicable — used to compute "unusual endpoint access". */
  endpoint?: string;
  timestamp: string;
}
