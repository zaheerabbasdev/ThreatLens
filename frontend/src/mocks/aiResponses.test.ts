import { describe, expect, it } from "vitest";
import { getCannedAssistantAnswer } from "./aiResponses";

describe("getCannedAssistantAnswer", () => {
  it("summarizes a referenced incident", () => {
    const answer = getCannedAssistantAnswer("Summarize INC-1");
    expect(answer).toContain("INC-1");
    expect(answer).toContain("Credential-harvesting phishing campaign targeting finance");
  });

  it("explains why a referenced incident scored the way it did", () => {
    const answer = getCannedAssistantAnswer("Why is INC-1 high risk?");
    expect(answer).toMatch(/INC-1 scored \d+\/100/);
    expect(answer).toContain("Indicator reputation");
  });

  it("lists MITRE techniques mapped to a referenced incident", () => {
    const answer = getCannedAssistantAnswer("Which MITRE techniques are associated with INC-1?");
    expect(answer).toContain("T1566");
  });

  it("falls back to a summary when an incident is referenced with no specific intent", () => {
    const answer = getCannedAssistantAnswer("Tell me about INC-3");
    expect(answer).toContain("INC-3");
  });

  it("explains relations for a referenced indicator value", () => {
    const answer = getCannedAssistantAnswer("What's related to 185.220.101.47?");
    expect(answer).toContain("185.220.101.47");
    expect(answer).toContain("INC-3");
  });

  it("falls back to a generic risk-score explanation when no incident is named", () => {
    const answer = getCannedAssistantAnswer("Why is this incident high risk?");
    expect(answer).toMatch(/deterministically/i);
  });

  it("returns the default fallback for unrecognized questions", () => {
    const answer = getCannedAssistantAnswer("What's the weather like?");
    expect(answer).toMatch(/Summarize INC-1/);
  });
});
