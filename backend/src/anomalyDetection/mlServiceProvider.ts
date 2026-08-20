import { z } from "zod";
import type { EventFeatures } from "./featureExtraction.js";
import type { AnomalyDetectionOutput, AnomalyDetectionProvider } from "./anomalyProvider.js";
import { AnomalyProviderError } from "./anomalyProvider.js";

/** Minimal structural interface for the HTTP client this provider needs — same DI pattern as ai/openaiProvider.ts's ChatClient and threatIntel/virusTotalProvider.ts's HttpClient. */
export interface HttpClient {
  post(url: string, body: unknown): Promise<{ status: number; json(): Promise<unknown> }>;
}

/** Real implementation, used by server.ts — wraps global fetch with a hard timeout. The ML service is on-prem/self-hosted (unlike OpenAI/VirusTotal), so a short timeout is appropriate: a slow response means the service itself is struggling, not normal internet latency. */
export function buildFetchHttpClient(timeoutMs = 5000): HttpClient {
  return {
    async post(url, body) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        return { status: res.status, json: () => res.json() };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

// Only the subset of the ML service's response this provider reads — zod
// validated rather than trusted, same reasoning as ai/openaiProvider.ts and
// threatIntel/virusTotalProvider.ts: an internal service's response shape
// changing shouldn't turn into a silently-wrong anomaly score.
const contributionSchema = z.object({
  feature: z.string(),
  z_score: z.number(),
  direction: z.enum(["higher_than_typical", "lower_than_typical"]),
});
const analyzeResponseSchema = z.object({
  is_anomaly: z.boolean(),
  anomaly_score: z.number().min(0).max(100),
  confidence: z.enum(["low", "medium", "high"]),
  contributing_features: z.array(contributionSchema),
  model_version: z.string(),
});

function toFeaturePayload(features: EventFeatures): Record<string, number> {
  // Field names must match ml-service/app/schemas.py's FEATURE_NAMES
  // exactly — this is the one place that mapping happens.
  return {
    login_hour_deviation: features.loginHourDeviation,
    new_geo_location: features.newGeoLocation,
    request_frequency: features.requestFrequency,
    resource_access_count: features.resourceAccessCount,
    file_download_count: features.fileDownloadCount,
    auth_failure_count: features.authFailureCount,
    unusual_endpoint_count: features.unusualEndpointCount,
  };
}

/** Calls the self-hosted Python FastAPI anomaly-detection service (spec §42). */
export class MlServiceProvider implements AnomalyDetectionProvider {
  readonly name = "ml-service";

  constructor(
    private readonly http: HttpClient,
    private readonly baseUrl: string,
  ) {}

  async detect(features: EventFeatures): Promise<{ output: AnomalyDetectionOutput; durationMs: number }> {
    const start = performance.now();

    let res: Awaited<ReturnType<HttpClient["post"]>>;
    try {
      res = await this.http.post(`${this.baseUrl}/analyze`, toFeaturePayload(features));
    } catch (err) {
      throw new AnomalyProviderError("ML service request failed (network error or timeout).", err, true);
    }

    const durationMs = Math.round(performance.now() - start);

    if (res.status === 422) {
      // Our own feature payload was malformed — a bug on this side, not a
      // transient provider problem, so it's not worth retrying.
      throw new AnomalyProviderError("ML service rejected the feature payload as invalid.", undefined, false);
    }
    if (res.status !== 200) {
      throw new AnomalyProviderError(`ML service returned an unexpected status (${res.status}).`, undefined, res.status >= 500);
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch (err) {
      throw new AnomalyProviderError("ML service returned a response that wasn't valid JSON.", err, true);
    }

    const parsed = analyzeResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new AnomalyProviderError("ML service returned an unexpected response shape.", parsed.error, false);
    }

    const output: AnomalyDetectionOutput = {
      isAnomaly: parsed.data.is_anomaly,
      anomalyScore: parsed.data.anomaly_score,
      confidence: parsed.data.confidence,
      contributingFeatures: parsed.data.contributing_features.map((c) => ({
        feature: c.feature,
        zScore: c.z_score,
        direction: c.direction,
      })),
      modelVersion: parsed.data.model_version,
    };

    return { output, durationMs };
  }
}
