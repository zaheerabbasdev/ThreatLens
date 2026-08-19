import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";
import { STATUS_CONFIG } from "@/constants/status";
import type { WorkflowStatus } from "@/types";

describe("StatusBadge", () => {
  it.each(Object.keys(STATUS_CONFIG) as WorkflowStatus[])(
    "renders the label for '%s' status (never color alone)",
    (status) => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(STATUS_CONFIG[status].label)).toBeInTheDocument();
    },
  );
});
