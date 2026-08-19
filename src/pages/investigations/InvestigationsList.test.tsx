import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InvestigationsList } from "./InvestigationsList";
import { renderWithProviders, signInAs } from "@/testUtils";

describe("InvestigationsList", () => {
  it("renders investigations once loaded", async () => {
    signInAs();
    renderWithProviders(<InvestigationsList />);
    await waitFor(
      () => {
        expect(screen.getByText(/Finance-targeted phishing infrastructure cluster/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("shows an empty state when no investigation matches the search", async () => {
    signInAs();
    renderWithProviders(<InvestigationsList />);
    const search = await screen.findByPlaceholderText("Search investigations…");
    await userEvent.type(search, "zzz-no-such-investigation");
    await waitFor(
      () => {
        expect(screen.getByText("No investigations match these filters")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("opens the create-investigation modal for an analyst with write access", async () => {
    signInAs();
    renderWithProviders(<InvestigationsList />);
    const button = await screen.findByRole("button", { name: "New investigation" });
    await userEvent.click(button);
    expect(await screen.findByRole("heading", { name: "Open a new investigation" })).toBeInTheDocument();
  });
});
