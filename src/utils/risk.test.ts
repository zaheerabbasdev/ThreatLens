import { describe, expect, it } from "vitest";
import { calculateRiskScore, severityFromScore } from "./risk";

describe("severityFromScore", () => {
  it("maps score boundaries to the correct severity", () => {
    expect(severityFromScore(95)).toBe("critical");
    expect(severityFromScore(85)).toBe("critical");
    expect(severityFromScore(84)).toBe("high");
    expect(severityFromScore(65)).toBe("high");
    expect(severityFromScore(64)).toBe("medium");
    expect(severityFromScore(40)).toBe("medium");
    expect(severityFromScore(39)).toBe("low");
    expect(severityFromScore(15)).toBe("low");
    expect(severityFromScore(14)).toBe("info");
    expect(severityFromScore(0)).toBe("info");
  });
});

describe("calculateRiskScore", () => {
  it("computes a weighted average of factor contributions", () => {
    const result = calculateRiskScore(
      [
        { label: "A", weight: 1, contribution: 100, description: "" },
        { label: "B", weight: 1, contribution: 0, description: "" },
      ],
      "2026-01-01T00:00:00Z",
    );
    expect(result.value).toBe(50);
    expect(result.severity).toBe("medium");
  });

  it("weights higher-weight factors more heavily", () => {
    const result = calculateRiskScore(
      [
        { label: "A", weight: 3, contribution: 90, description: "" },
        { label: "B", weight: 1, contribution: 10, description: "" },
      ],
      "2026-01-01T00:00:00Z",
    );
    // (3*90 + 1*10) / 4 = 70
    expect(result.value).toBe(70);
    expect(result.severity).toBe("high");
  });

  it("clamps the result between 0 and 100", () => {
    const result = calculateRiskScore(
      [{ label: "A", weight: 1, contribution: 500, description: "" }],
      "2026-01-01T00:00:00Z",
    );
    expect(result.value).toBe(100);
  });

  it("falls back to 0 when given no factors instead of dividing by zero", () => {
    const result = calculateRiskScore([], "2026-01-01T00:00:00Z");
    expect(result.value).toBe(0);
    expect(result.severity).toBe("info");
  });

  it("preserves the factors it was given for explainability", () => {
    const factors = [{ label: "A", weight: 1, contribution: 50, description: "desc" }];
    const result = calculateRiskScore(factors, "2026-01-01T00:00:00Z");
    expect(result.factors).toEqual(factors);
    expect(result.calculatedAt).toBe("2026-01-01T00:00:00Z");
  });
});
