import { describe, expect, it } from "vitest";
import { formatRelativeTime, formatShortId, initials, truncate, truncateMiddle } from "./format";

describe("formatRelativeTime", () => {
  const now = new Date("2026-08-15T12:00:00Z");

  it("returns 'just now' for sub-minute deltas", () => {
    expect(formatRelativeTime("2026-08-15T11:59:45Z", now)).toBe("just now");
  });

  it("formats past hours", () => {
    expect(formatRelativeTime("2026-08-15T09:00:00Z", now)).toBe("3 hours ago");
  });

  it("formats future minutes", () => {
    expect(formatRelativeTime("2026-08-15T12:10:00Z", now)).toBe("in 10 minutes");
  });
});

describe("truncate", () => {
  it("leaves short strings untouched", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long strings with an ellipsis", () => {
    expect(truncate("hello world", 6)).toBe("hello…");
  });
});

describe("truncateMiddle", () => {
  it("keeps short values untouched", () => {
    expect(truncateMiddle("short", 6)).toBe("short");
  });

  it("truncates the middle of long values", () => {
    const long = "185.220.101.47-some-very-long-indicator-value";
    const result = truncateMiddle(long, 6);
    expect(result.startsWith("185.22")).toBe(true);
    expect(result).toContain("…");
  });
});

describe("initials", () => {
  it("builds initials from first and last name", () => {
    expect(initials("Avery Chen")).toBe("AC");
  });

  it("handles a single name", () => {
    expect(initials("Cher")).toBe("C");
  });
});

describe("formatShortId", () => {
  it("formats a prefixed id into a readable display id", () => {
    expect(formatShortId("inc_1")).toBe("INC-1");
    expect(formatShortId("alert_12")).toBe("ALERT-12");
  });

  it("falls back to an uppercased id when there is no underscore", () => {
    expect(formatShortId("standalone")).toBe("STANDALONE");
  });
});
