import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SeverityBadge } from "./SeverityBadge";
import { SEVERITY_CONFIG } from "@/constants/severity";
import type { Severity } from "@/types";

describe("SeverityBadge", () => {
  it.each(Object.keys(SEVERITY_CONFIG) as Severity[])(
    "renders the label for '%s' severity (never color alone)",
    (severity) => {
      render(<SeverityBadge severity={severity} />);
      expect(screen.getByText(SEVERITY_CONFIG[severity].label)).toBeInTheDocument();
    },
  );
});
