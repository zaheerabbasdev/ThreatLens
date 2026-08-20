import { describe, expect, it, vi } from "vitest";
import { MlServiceProvider, type HttpClient } from "./mlServiceProvider.js";
import { AnomalyProviderError } from "./anomalyProvider.js";
import type { EventFeatures } from "./featureExtraction.js";

const FEATURES: EventFeatures = {
  loginHourDeviation: 1,
  newGeoLocation: 0,
  requestFrequency: 0.1,
  resourceAccessCount: 3,
  fileDownloadCount: 0,
  authFailureCount: 0,
  unusualEndpointCount: 0,
};

function fakeClient(status: number, body: unknown): HttpClient {
  return { post: vi.fn().mockResolvedValue({ status, json: () => Promise.resolve(body) }) };
}

function validResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    is_anomaly: false,
    anomaly_score: 12.5,
    confidence: "low",
    contributing_features: [{ feature: "request_frequency", z_score: 0.4, direction: "higher_than_typical" }],
    model_version: "isolation-forest-synthetic-baseline-v1",
    ...overrides,
  };
}

describe("MlServiceProvider", () => {
  it("maps a valid response to AnomalyDetectionOutput", async () => {
    const client = fakeClient(200, validResponse());
    const provider = new MlServiceProvider(client, "http://ml.local");
    const result = await provider.detect(FEATURES);
    expect(result.output.isAnomaly).toBe(false);
    expect(result.output.anomalyScore).toBe(12.5);
    expect(result.output.confidence).toBe("low");
    expect(result.output.contributingFeatures[0]).toEqual({
      feature: "request_frequency",
      zScore: 0.4,
      direction: "higher_than_typical",
    });
  });

  it("posts to <baseUrl>/analyze with snake_case feature keys the Python service expects", async () => {
    const client = fakeClient(200, validResponse());
    const provider = new MlServiceProvider(client, "http://ml.local");
    await provider.detect(FEATURES);
    const [url, body] = vi.mocked(client.post).mock.calls[0]!;
    expect(url).toBe("http://ml.local/analyze");
    expect(body).toEqual({
      login_hour_deviation: 1,
      new_geo_location: 0,
      request_frequency: 0.1,
      resource_access_count: 3,
      file_download_count: 0,
      auth_failure_count: 0,
      unusual_endpoint_count: 0,
    });
  });

  it("throws a non-retryable AnomalyProviderError on 422 (our own payload was invalid)", async () => {
    const client = fakeClient(422, {});
    const provider = new MlServiceProvider(client, "http://ml.local");
    const err = await provider.detect(FEATURES).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AnomalyProviderError);
    expect((err as AnomalyProviderError).retryable).toBe(false);
  });

  it("throws a retryable AnomalyProviderError on a 5xx", async () => {
    const client = fakeClient(503, {});
    const provider = new MlServiceProvider(client, "http://ml.local");
    const err = await provider.detect(FEATURES).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AnomalyProviderError);
    expect((err as AnomalyProviderError).retryable).toBe(true);
  });

  it("throws AnomalyProviderError when the response doesn't match the expected schema", async () => {
    const client = fakeClient(200, { totally: "wrong" });
    const provider = new MlServiceProvider(client, "http://ml.local");
    await expect(provider.detect(FEATURES)).rejects.toBeInstanceOf(AnomalyProviderError);
  });

  it("wraps a network failure as AnomalyProviderError, not a raw error", async () => {
    const client: HttpClient = { post: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) };
    const provider = new MlServiceProvider(client, "http://ml.local");
    await expect(provider.detect(FEATURES)).rejects.toBeInstanceOf(AnomalyProviderError);
  });

  it("rejects a score outside 0-100 as a schema violation", async () => {
    const client = fakeClient(200, validResponse({ anomaly_score: 142 }));
    const provider = new MlServiceProvider(client, "http://ml.local");
    await expect(provider.detect(FEATURES)).rejects.toBeInstanceOf(AnomalyProviderError);
  });
});
