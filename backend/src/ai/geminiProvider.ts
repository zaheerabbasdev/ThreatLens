import type {
  AIProvider,
  AIResult,
  AnswerQuestionInput,
  AnswerQuestionOutput,
  AnalyzeIncidentInput,
  AnalyzeIncidentOutput,
  GenerateRecommendationsInput,
  GenerateRecommendationsOutput,
} from "./aiProvider.js";
import { answerQuestionOutputSchema, analyzeIncidentOutputSchema, generateRecommendationsOutputSchema, AIProviderError } from "./aiProvider.js";
import { wrapUntrustedData, truncateForPrompt, pick } from "./promptSafety.js";

interface GeminiClient {
  generateContent(model: string, apiKey: string, request: GeminiRequest): Promise<GeminiResponse>;
}

interface GeminiRequest {
  systemInstruction: { parts: Array<{ text: string }> };
  contents: Array<{ role: "user"; parts: Array<{ text: string }> }>;
  generationConfig: { responseMimeType: "application/json"; temperature: number };
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  usageMetadata?: { totalTokenCount?: number };
}

const SYSTEM_PREAMBLE =
  "You are the ThreatLens AI security assistant. You ASSIST human analysts — you never " +
  "make or execute security decisions yourself (spec §52). Your output is always a " +
  "supporting explanation, summary, or suggestion, clearly distinguishable from " +
  "deterministic platform data (risk scores, MITRE mappings, correlation evidence), never " +
  "a replacement for it. Respond with a single JSON object only, matching the schema " +
  "described in each request — no prose outside the JSON, no markdown code fences.";

class FetchGeminiClient implements GeminiClient {
  async generateContent(model: string, apiKey: string, request: GeminiRequest): Promise<GeminiResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(request),
      },
    );
    if (!response.ok) {
      throw new Error(`Gemini API returned HTTP ${response.status}`);
    }
    return (await response.json()) as GeminiResponse;
  }
}

export class GeminiProvider implements AIProvider {
  readonly label = "gemini";

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly client: GeminiClient = new FetchGeminiClient(),
  ) {}

  private async complete<T>(userPrompt: string, schema: { parse: (v: unknown) => T }): Promise<AIResult<T>> {
    const started = Date.now();
    let response: GeminiResponse;
    try {
      response = await this.client.generateContent(this.model, this.apiKey, {
        systemInstruction: { parts: [{ text: SYSTEM_PREAMBLE }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      });
    } catch (err) {
      throw new AIProviderError(`AI provider request failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    const raw = response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!raw) throw new AIProviderError("AI provider returned an empty response.");

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new AIProviderError("AI provider returned a response that was not valid JSON.");
    }

    const result = schema.parse(parsed);
    return { output: result, tokensUsed: response.usageMetadata?.totalTokenCount, durationMs: Date.now() - started };
  }

  answerQuestion(input: AnswerQuestionInput): Promise<AIResult<AnswerQuestionOutput>> {
    const context = input.incidentContext
      ? wrapUntrustedData("incident_context", pick(input.incidentContext, ["id", "title", "description", "status", "severity"]))
      : "";
    const prompt = [
      context,
      wrapUntrustedData("analyst_question", truncateForPrompt(input.question)),
      'Respond with JSON: { "answer": string }. Answer the analyst\'s question helpfully and concisely, using the incident context only if it\'s relevant to the question.',
    ]
      .filter(Boolean)
      .join("\n\n");
    return this.complete(prompt, answerQuestionOutputSchema);
  }

  analyzeIncident(input: AnalyzeIncidentInput): Promise<AIResult<AnalyzeIncidentOutput>> {
    const prompt = [
      wrapUntrustedData("incident", { ...pick(input.incident, ["title", "description", "severity", "status", "affectedAssets", "mitreTechniqueIds"]) }),
      'Respond with JSON: { "summary": string, "keyFindings": string[], "suggestedMitreTechniqueIds": string[] }. ' +
        "Summarize what happened, list up to 5 key findings a human analyst should know, and suggest any " +
        "additional MITRE ATT&CK technique IDs that plausibly apply beyond the ones already mapped — only ones " +
        "you have real basis for from the incident data, never invented.",
    ].join("\n\n");
    return this.complete(prompt, analyzeIncidentOutputSchema);
  }

  generateRecommendations(input: GenerateRecommendationsInput): Promise<AIResult<GenerateRecommendationsOutput>> {
    const prompt = [
      wrapUntrustedData("incident", pick(input.incident, ["title", "description", "severity", "status"])),
      'Respond with JSON: { "recommendations": [{ "title": string, "description": string }] }. ' +
        "Suggest 2-4 concrete response actions a human analyst could take next. These are SUGGESTIONS ONLY " +
        "(spec §57/§58) — every one requires explicit human approval before anything happens; do not phrase " +
        "them as already-taken actions.",
    ].join("\n\n");
    return this.complete(prompt, generateRecommendationsOutputSchema);
  }
}
