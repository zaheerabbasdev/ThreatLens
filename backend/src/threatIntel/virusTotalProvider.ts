import { z } from "zod";
import type { ThreatIntelLookupInput, ThreatIntelLookupOutput, ThreatIntelProvider } from "./threatIntelProvider.js";
import { ThreatIntelProviderError, ThreatIntelQuotaError } from "./threatIntelProvider.js";

/**
 * Minimal structural interface for the HTTP client this provider needs —
 * same dependency-injection trick as ai/openaiProvider.ts's ChatClient.
 * Lets this class be unit-tested against a fake implementation with no
 * network access, while production code injects a real `fetch`-backed one
 * (see buildFetchHttpClient below).
 */
export interface HttpClient {
  get(url: string, headers: Record<string, string>): Promise<{ status: number; json(): Promise<unknown> }>;
}

/** Real implementation, used by server.ts/app.ts — wraps global fetch with a hard timeout (spec §40: "handle timeouts"). */
export function buildFetchHttpClient(timeoutMs = 8000): HttpClient {
  return {
    async get(url, headers) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { headers, signal: controller.signal });
        return { status: res.status, json: () => res.json() };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

// Only the subset of VirusTotal's v3 response this provider actually reads.
// Zod-validated rather than trusted as-is (spec §56's "never trust raw
// structured output" applies just as much to an external API as to an AI
// model) — a field VT renames/removes surfaces as a clean
// ThreatIntelProviderError, not a silent wrong verdict.
const vtAttributesSchema = z.object({
  last_analysis_stats: z.object({
    malicious: z.number().nonnegative(),
    suspicious: z.number().nonnegative(),
    harmless: z.number().nonnegative(),
    undetected: z.number().nonnegative(),
  }),
  popular_threat_classification: z
    .object({ suggested_threat_label: z.string().optional() })
    .optional(),
});
const vtResponseSchema = z.object({ data: z.object({ attributes: vtAttributesSchema }) });

/** Deterministic, explainable mapping from VT's per-engine vote counts to our verdict/score/confidence — no ML, no LLM, same "explainable model" spirit as spec §42's anomaly detection guidance. */
function toOutput(attributes: z.infer<typeof vtAttributesSchema>): ThreatIntelLookupOutput {
  const { malicious, suspicious, harmless, undetected } = attributes.last_analysis_stats;
  const total = malicious + suspicious + harmless + undetected;
  const categories = attributes.popular_threat_classification?.suggested_threat_label
    ? [attributes.popular_threat_classification.suggested_threat_label]
    : [];

  const confidence = total >= 30 ? "high" : total >= 10 ? "medium" : total > 0 ? "low" : "unverified";

  if (total === 0) return { verdict: "unknown", confidence: "unverified", categories };
  if (malicious > 0) return { verdict: "malicious", score: Math.min(100, 60 + malicious * 4), confidence, categories };
  if (suspicious > 0) return { verdict: "suspicious", score: Math.min(70, 30 + suspicious * 5), confidence, categories };
  return { verdict: "clean", score: 5, confidence, categories };
}

/**
 * VirusTotal v3 (spec §40). One of potentially several ThreatIntelProviders
 * — nothing in ioc.service.ts assumes this is the only one, or hardcodes
 * "VirusTotal" anywhere outside this file and server.ts's wiring.
 */
export class VirusTotalProvider implements ThreatIntelProvider {
  readonly name = "virustotal";

  constructor(
    private readonly http: HttpClient,
    private readonly apiKey: string,
  ) {}

  async lookup(input: ThreatIntelLookupInput): Promise<{ output: ThreatIntelLookupOutput; durationMs: number }> {
    const start = performance.now();
    const url = this.buildUrl(input);

    let res: Awaited<ReturnType<HttpClient["get"]>>;
    try {
      res = await this.http.get(url, { "x-apikey": this.apiKey });
    } catch (err) {
      throw new ThreatIntelProviderError("VirusTotal request failed (network error or timeout).", err, true);
    }

    const durationMs = Math.round(performance.now() - start);

    if (res.status === 429) throw new ThreatIntelQuotaError();
    if (res.status === 404) {
      // Not an error — VT simply has no data on this indicator yet
      // (spec §40: "handle ... missing data").
      return { output: { verdict: "unknown", confidence: "unverified", categories: [] }, durationMs };
    }
    if (res.status === 401 || res.status === 403) {
      throw new ThreatIntelProviderError("VirusTotal rejected the configured API key.", undefined, false);
    }
    if (res.status !== 200) {
      throw new ThreatIntelProviderError(`VirusTotal returned an unexpected status (${res.status}).`, undefined, res.status >= 500);
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch (err) {
      throw new ThreatIntelProviderError("VirusTotal returned a response that wasn't valid JSON.", err, true);
    }

    const parsed = vtResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new ThreatIntelProviderError("VirusTotal returned an unexpected response shape.", parsed.error, false);
    }

    return { output: toOutput(parsed.data.data.attributes), durationMs };
  }

  private buildUrl(input: ThreatIntelLookupInput): string {
    const base = "https://www.virustotal.com/api/v3";
    switch (input.type) {
      case "ip":
        return `${base}/ip_addresses/${encodeURIComponent(input.value)}`;
      case "domain":
        return `${base}/domains/${encodeURIComponent(input.value)}`;
      case "url": {
        // VT identifies URLs by the base64url (no padding) of the URL itself.
        const id = Buffer.from(input.value).toString("base64url").replace(/=+$/, "");
        return `${base}/urls/${id}`;
      }
      case "hash":
        return `${base}/files/${encodeURIComponent(input.value)}`;
    }
  }
}
