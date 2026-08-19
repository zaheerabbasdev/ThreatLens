import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MitreBrowser } from "./MitreBrowser";
import { renderWithProviders } from "@/testUtils";

describe("MitreBrowser", () => {
  it("renders techniques once loaded", async () => {
    renderWithProviders(<MitreBrowser />);
    await waitFor(
      () => {
        expect(screen.getByText("Phishing")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("filters to a single tactic", async () => {
    renderWithProviders(<MitreBrowser />);
    const tacticChip = await screen.findByRole("button", { name: "Exfiltration" }, { timeout: 5000 });
    await userEvent.click(tacticChip);
    await waitFor(
      () => {
        expect(screen.getByText("Exfiltration Over C2 Channel")).toBeInTheDocument();
        expect(screen.queryByText("Phishing")).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("shows an empty state when no technique matches the search", async () => {
    renderWithProviders(<MitreBrowser />);
    const search = await screen.findByPlaceholderText("Search by technique ID or name…");
    await userEvent.type(search, "zzz-no-such-technique");
    await waitFor(
      () => {
        expect(screen.getByText("No techniques match these filters")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });
});
