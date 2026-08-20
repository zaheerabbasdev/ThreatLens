import { describe, expect, it, vi } from "vitest";
import { VirusTotalProvider, type HttpClient } from "./virusTotalProvider.js";
import { ThreatIntelProviderError, ThreatIntelQuotaError } from "./threatIntelProvider.js";

/** Real, executable tests against a FAKE http client — no network, no VIRUSTOTAL_API_KEY needed. Same pattern as ai/openaiProvider.test.ts's fake ChatClient. */
function fakeClient(status: number, body: unknown): HttpClient {
  return { get: vi.fn().mockResolvedValue({ status, json: () => Promise.resolve(body) }) };
}

function statsResponse(stats: { malicious?: number; suspicious?: number; harmless?: number; undetected?: number }) {
  return {
    data: {
      attributes: {
        last_analysis_stats: { malicious: 0, suspicious: 0, harmless: 0, undetected: 0, ...stats },
      },
    },
  };
}

describe("VirusTotalProvider", () => {
  it("maps a clean verdict to a low deterministic score", async () => {
    const client = fakeClient(200, statsResponse({ harmless: 40, undetected: 10 }));
    const provider = new VirusTotalProvider(client, "fake-key");
    const result = await provider.lookup({ type: "ip", value: "8.8.8.8" });
    expect(result.output.verdict).toBe("clean");
    expect(result.output.score).toBe(5);
    expect(result.output.confidence).toBe("high"); // 50 engines reported
  });

  it("maps a malicious verdict with a score that scales with vote count", async () => {
    const client = fakeClient(200, statsResponse({ malicious: 10, harmless: 40 }));
    const provider = new VirusTotalProvider(client, "fake-key");
    const result = await provider.lookup({ type: "hash", value: "a".repeat(64) });
    expect(result.output.verdict).toBe("malicious");
    expect(result.output.score).toBe(100); // capped
  });

  it("maps a suspicious verdict when there's no outright malicious vote", async () => {
    const client = fakeClient(200, statsResponse({ suspicious: 2, harmless: 40 }));
    const provider = new VirusTotalProvider(client, "fake-key");
    const result = await provider.lookup({ type: "domain", value: "example.test" });
    expect(result.output.verdict).toBe("suspicious");
    expect(result.output.score).toBe(40);
  });

  it("returns unknown (not an error) when the total engine count is zero", async () => {
    const client = fakeClient(200, statsResponse({}));
    const provider = new VirusTotalProvider(client, "fake-key");
    const result = await provider.lookup({ type: "ip", value: "1.2.3.4" });
    expect(result.output.verdict).toBe("unknown");
    expect(result.output.confidence).toBe("unverified");
  });

  it("returns unknown on a 404 — missing data is not an error (spec §40)", async () => {
    const client = fakeClient(404, {});
    const provider = new VirusTotalProvider(client, "fake-key");
    const result = await provider.lookup({ type: "ip", value: "1.2.3.4" });
    expect(result.output.verdict).toBe("unknown");
  });

  it("throws ThreatIntelQuotaError on 429, distinct from a generic failure", async () => {
    const client = fakeClient(429, {});
    const provider = new VirusTotalProvider(client, "fake-key");
    await expect(provider.lookup({ type: "ip", value: "1.2.3.4" })).rejects.toBeInstanceOf(ThreatIntelQuotaError);
  });

  it("throws a non-retryable ThreatIntelProviderError on 401 (bad API key)", async () => {
    const client = fakeClient(401, {});
    const provider = new VirusTotalProvider(client, "fake-key");
    const err = await provider.lookup({ type: "ip", value: "1.2.3.4" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ThreatIntelProviderError);
    expect((err as ThreatIntelProviderError).retryable).toBe(false);
  });

  it("throws a retryable ThreatIntelProviderError on a 5xx", async () => {
    const client = fakeClient(503, {});
    const provider = new VirusTotalProvider(client, "fake-key");
    const err = await provider.lookup({ type: "ip", value: "1.2.3.4" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ThreatIntelProviderError);
    expect((err as ThreatIntelProviderError).retryable).toBe(true);
  });

  it("throws ThreatIntelProviderError when the response shape doesn't match what we expect (spec §56-style validation)", async () => {
    const client = fakeClient(200, { data: { attributes: { totally: "wrong" } } });
    const provider = new VirusTotalProvider(client, "fake-key");
    await expect(provider.lookup({ type: "ip", value: "1.2.3.4" })).rejects.toBeInstanceOf(ThreatIntelProviderError);
  });

  it("wraps a network failure as ThreatIntelProviderError, not a raw error", async () => {
    const client: HttpClient = { get: vi.fn().mockRejectedValue(new Error("ECONNRESET")) };
    const provider = new VirusTotalProvider(client, "fake-key");
    await expect(provider.lookup({ type: "ip", value: "1.2.3.4" })).rejects.toBeInstanceOf(ThreatIntelProviderError);
  });

  it("sends the API key as the x-apikey header", async () => {
    const client = fakeClient(200, statsResponse({ harmless: 5 }));
    const provider = new VirusTotalProvider(client, "secret-key-123");
    await provider.lookup({ type: "ip", value: "1.2.3.4" });
    expect(vi.mocked(client.get)).toHaveBeenCalledWith(expect.any(String), { "x-apikey": "secret-key-123" });
  });

  it("builds distinct URLs per indicator type", async () => {
    const client = fakeClient(200, statsResponse({ harmless: 5 }));
    const provider = new VirusTotalProvider(client, "key");

    await provider.lookup({ type: "ip", value: "1.2.3.4" });
    expect(vi.mocked(client.get).mock.calls[0]![0]).toContain("/ip_addresses/1.2.3.4");

    await provider.lookup({ type: "domain", value: "example.test" });
    expect(vi.mocked(client.get).mock.calls[1]![0]).toContain("/domains/example.test");

    await provider.lookup({ type: "hash", value: "a".repeat(64) });
    expect(vi.mocked(client.get).mock.calls[2]![0]).toContain(`/files/${"a".repeat(64)}`);

    await provider.lookup({ type: "url", value: "https://evil.test/path" });
    expect(vi.mocked(client.get).mock.calls[3]![0]).toContain("/urls/");
  });
});
