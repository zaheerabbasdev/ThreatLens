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

/**
 * The narrow slice of the OpenAI SDK this module actually needs — injected
 * rather than depending on the concrete `OpenAI` class directly, so tests
 * can supply a fake that returns canned completions without a real API key
 * or network access. `OpenAI`'s own client satisfies this interface as-is.
 */
export interface ChatClient {
  chat: {
    completions: {
      create(params: {
        model: string;
        messages: Array<{ role: "system" | "user"; content: string }>;
        response_format: { type: "json_object" };
        temperature?: number;
      }): Promise<{
        choices: Array<{ message: { content: string | null } }>;
        usage?: { total_tokens?: number };
      }>;
    };
  };
}

const SYSTEM_PREAMBLE =
  "You are the ThreatLens AI security assistant. You ASSIST human analysts — you never " +
  "make or execute security decisions yourself (spec §52). Your output is always a " +
  "supporting explanation, summary, or suggestion, clearly distinguishable from " +
  "deterministic platform data (risk scores, MITRE mappings, correlation evidence), never " +
  "a replacement for it. Respond with a single JSON object only, matching the schema " +
  "described in each request — no prose outside the JSON, no markdown code fences.";

/** Real network calls (OpenAI's API) — never exercised in this environment; see backend/README.md's Phase 6 section for why, and openaiProvider.test.ts for what IS covered (every method here, against an injected fake client). */
export class OpenAIProvider implements AIProvider {
  readonly label = "openai";

  constructor(
    private readonly client: ChatClient,
    private readonly model: string,
  ) {}

  private async complete<T>(
    userPrompt: string,
    schema: { parse: (v: unknown) => T },
  ): Promise<AIResult<T>> {
    const started = Date.now();
    let response;
    try {
      response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PREAMBLE },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
    } catch (err) {
      throw new AIProviderError(`AI provider request failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    const raw = response.choices[0]?.message.content;
    if (!raw) throw new AIProviderError("AI provider returned an empty response.");

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Never trust raw AI output (spec §56) — a non-JSON response is
      // rejected outright, not "best-effort" salvaged.
      throw new AIProviderError("AI provider returned a response that was not valid JSON.");
    }

    const result = schema.parse(parsed); // throws ZodError on shape mismatch — caller's asyncHandler turns that into a clean 422, not a raw AI payload reaching the client.
    return { output: result, tokensUsed: response.usage?.total_tokens, durationMs: Date.now() - started };
  }

  async answerQuestion(input: AnswerQuestionInput): Promise<AIResult<AnswerQuestionOutput>> {
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

  async analyzeIncident(input: AnalyzeIncidentInput): Promise<AIResult<AnalyzeIncidentOutput>> {
    const prompt = [
      wrapUntrustedData("incident", {
        ...pick(input.incident, ["title", "description", "severity", "status", "affectedAssets", "mitreTechniqueIds"]),
      }),
      'Respond with JSON: { "summary": string, "keyFindings": string[], "suggestedMitreTechniqueIds": string[] }. ' +
        "Summarize what happened, list up to 5 key findings a human analyst should know, and suggest any " +
        "additional MITRE ATT&CK technique IDs (format Txxxx or Txxxx.xxx) that plausibly apply beyond the " +
        "ones already mapped — only ones you have real basis for from the incident data, never invented.",
    ].join("\n\n");
    return this.complete(prompt, analyzeIncidentOutputSchema);
  }

  async generateRecommendations(input: GenerateRecommendationsInput): Promise<AIResult<GenerateRecommendationsOutput>> {
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
