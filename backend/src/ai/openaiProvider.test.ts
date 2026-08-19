import { describe, expect, it, vi } from "vitest";
import { OpenAIProvider, type ChatClient } from "./openaiProvider.js";
import { AIProviderError } from "./aiProvider.js";

/**
 * Real, executable tests against a FAKE chat client — no network, no
 * OPENAI_API_KEY needed. This covers everything except the literal "make
 * an HTTP request to OpenAI's servers" line, which the real `OpenAI` SDK
 * client (injected here as `ChatClient`) is responsible for and which
 * this codebase never re-implements. See backend/README.md's Phase 6
 * section.
 */
function fakeClient(content: string, usage?: { total_tokens?: number }): ChatClient {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content } }],
          usage,
        }),
      },
    },
  };
}

describe("OpenAIProvider", () => {
  describe("answerQuestion", () => {
    it("returns the parsed, validated answer", async () => {
      const client = fakeClient(JSON.stringify({ answer: "Here is the answer." }), { total_tokens: 42 });
      const provider = new OpenAIProvider(client, "gpt-4o-mini");
      const result = await provider.answerQuestion({ question: "What happened?" });
      expect(result.output.answer).toBe("Here is the answer.");
      expect(result.tokensUsed).toBe(42);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("sends a system message separate from the user content (spec §55)", async () => {
      const client = fakeClient(JSON.stringify({ answer: "ok" }));
      const provider = new OpenAIProvider(client, "gpt-4o-mini");
      await provider.answerQuestion({ question: "test question" });

      const call = vi.mocked(client.chat.completions.create).mock.calls[0]![0];
      expect(call.messages[0]!.role).toBe("system");
      expect(call.messages[1]!.role).toBe("user");
      expect(call.messages[1]!.content).toContain("test question");
    });

    it("requests JSON object response format (spec §56 — structured output)", async () => {
      const client = fakeClient(JSON.stringify({ answer: "ok" }));
      const provider = new OpenAIProvider(client, "gpt-4o-mini");
      await provider.answerQuestion({ question: "q" });
      const call = vi.mocked(client.chat.completions.create).mock.calls[0]![0];
      expect(call.response_format).toEqual({ type: "json_object" });
    });

    it("includes incident context in the prompt when provided, wrapped as untrusted data", async () => {
      const client = fakeClient(JSON.stringify({ answer: "ok" }));
      const provider = new OpenAIProvider(client, "gpt-4o-mini");
      await provider.answerQuestion({
        question: "why is this critical?",
        incidentContext: { id: "inc_1", title: "Phishing campaign", description: "desc", status: "open", severity: "critical" },
      });
      const call = vi.mocked(client.chat.completions.create).mock.calls[0]![0];
      const userContent = call.messages[1]!.content;
      expect(userContent).toContain("Phishing campaign");
      expect(userContent).toContain('source="incident_context"');
    });

    it("redacts a secret embedded in the question before it reaches the prompt", async () => {
      const client = fakeClient(JSON.stringify({ answer: "ok" }));
      const provider = new OpenAIProvider(client, "gpt-4o-mini");
      await provider.answerQuestion({ question: "here is my API_KEY=leaked_super_secret, can you help?" });
      const call = vi.mocked(client.chat.completions.create).mock.calls[0]![0];
      expect(call.messages[1]!.content).not.toContain("leaked_super_secret");
    });
  });

  describe("output validation (spec §56 — never trust raw AI output)", () => {
    it("throws AIProviderError when the response is not valid JSON", async () => {
      const client = fakeClient("this is not json at all");
      const provider = new OpenAIProvider(client, "gpt-4o-mini");
      await expect(provider.answerQuestion({ question: "q" })).rejects.toThrow(AIProviderError);
    });

    it("throws when JSON is valid but doesn't match the expected schema", async () => {
      const client = fakeClient(JSON.stringify({ totallyWrongField: 123 }));
      const provider = new OpenAIProvider(client, "gpt-4o-mini");
      // Zod's own error, not swallowed/reinterpreted — the centralized
      // error handler turns this into a clean 422 (see errorHandler.ts).
      await expect(provider.answerQuestion({ question: "q" })).rejects.toThrow();
    });

    it("throws AIProviderError when the response has no content at all", async () => {
      const client = fakeClient(null as unknown as string);
      const provider = new OpenAIProvider(client, "gpt-4o-mini");
      await expect(provider.answerQuestion({ question: "q" })).rejects.toThrow(AIProviderError);
    });

    it("rejects analyzeIncident output with too many key findings (schema max)", async () => {
      const client = fakeClient(
        JSON.stringify({
          summary: "ok",
          keyFindings: Array.from({ length: 20 }, (_, i) => `finding ${i}`),
          suggestedMitreTechniqueIds: [],
        }),
      );
      const provider = new OpenAIProvider(client, "gpt-4o-mini");
      await expect(
        provider.analyzeIncident({
          incident: { id: "inc_1", title: "t", description: "d", severity: "high", status: "open", affectedAssets: [], mitreTechniqueIds: [] },
        }),
      ).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    it("wraps a network/API failure as AIProviderError, not a raw error", async () => {
      const client: ChatClient = {
        chat: { completions: { create: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) } },
      };
      const provider = new OpenAIProvider(client, "gpt-4o-mini");
      await expect(provider.answerQuestion({ question: "q" })).rejects.toThrow(AIProviderError);
    });
  });

  describe("analyzeIncident", () => {
    it("returns validated summary/keyFindings/suggestedMitreTechniqueIds", async () => {
      const client = fakeClient(
        JSON.stringify({
          summary: "A phishing campaign targeting finance.",
          keyFindings: ["14 emails delivered", "1 click recorded"],
          suggestedMitreTechniqueIds: ["T1566"],
        }),
      );
      const provider = new OpenAIProvider(client, "gpt-4o-mini");
      const result = await provider.analyzeIncident({
        incident: {
          id: "inc_1",
          title: "Phishing campaign",
          description: "desc",
          severity: "critical",
          status: "investigating",
          affectedAssets: ["finance-pool"],
          mitreTechniqueIds: ["T1566"],
        },
      });
      expect(result.output.summary).toContain("phishing");
      expect(result.output.keyFindings).toHaveLength(2);
      expect(result.output.suggestedMitreTechniqueIds).toEqual(["T1566"]);
    });
  });

  describe("generateRecommendations", () => {
    it("returns validated recommendation drafts", async () => {
      const client = fakeClient(
        JSON.stringify({
          recommendations: [
            { title: "Force password reset", description: "Reset passwords for affected users." },
            { title: "Block sender domain", description: "Add the phishing domain to the mail gateway blocklist." },
          ],
        }),
      );
      const provider = new OpenAIProvider(client, "gpt-4o-mini");
      const result = await provider.generateRecommendations({
        incident: { id: "inc_1", title: "Phishing", description: "desc", severity: "critical", status: "open" },
      });
      expect(result.output.recommendations).toHaveLength(2);
      expect(result.output.recommendations[0]!.title).toBe("Force password reset");
    });

    it("rejects zero recommendations (schema min 1)", async () => {
      const client = fakeClient(JSON.stringify({ recommendations: [] }));
      const provider = new OpenAIProvider(client, "gpt-4o-mini");
      await expect(
        provider.generateRecommendations({
          incident: { id: "inc_1", title: "t", description: "d", severity: "high", status: "open" },
        }),
      ).rejects.toThrow();
    });
  });
});
