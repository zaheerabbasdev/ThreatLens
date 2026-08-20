import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuditLogsList } from "./AuditLogsList";
import { renderWithProviders } from "@/testUtils";

describe("AuditLogsList", () => {
  it("renders audit log entries once loaded", async () => {
    renderWithProviders(<AuditLogsList />);
    await waitFor(
      () => {
        expect(screen.getByText("Avery Chen")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("shows an empty state when no entry matches the search", async () => {
    renderWithProviders(<AuditLogsList />);
    const search = await screen.findByPlaceholderText("Search by actor, action, or resource…");
    await userEvent.type(search, "zzz-no-such-entry");
    await waitFor(
      () => {
        expect(screen.getByText("No audit events match these filters")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });
});
