import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportsList } from "./ReportsList";
import { renderWithProviders, signInAs } from "@/testUtils";

describe("ReportsList", () => {
  it("renders reports once loaded", async () => {
    signInAs();
    renderWithProviders(<ReportsList />);
    await waitFor(
      () => {
        expect(screen.getByText(/Weekly Security Summary/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("shows an empty state when no report matches the search", async () => {
    signInAs();
    renderWithProviders(<ReportsList />);
    const search = await screen.findByPlaceholderText("Search reports…");
    await userEvent.type(search, "zzz-no-such-report");
    await waitFor(
      () => {
        expect(screen.getByText("No reports match these filters")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("opens the generate-report modal for an analyst with generate access", async () => {
    signInAs();
    renderWithProviders(<ReportsList />);
    const button = await screen.findByRole("button", { name: "Generate report" });
    await userEvent.click(button);
    expect(await screen.findByRole("heading", { name: "Generate a report" })).toBeInTheDocument();
  });
});
