import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IOCOverview } from "./IOCOverview";
import { renderWithProviders, signInAs } from "@/testUtils";

describe("IOCOverview", () => {
  it("renders indicators once loaded", async () => {
    signInAs();
    renderWithProviders(<IOCOverview />);
    await waitFor(
      () => {
        expect(screen.getByText("185.220.101.47")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("shows an empty state when no indicator matches the search", async () => {
    signInAs();
    renderWithProviders(<IOCOverview />);
    const search = await screen.findByPlaceholderText("Search by value…");
    await userEvent.type(search, "zzz-no-such-indicator");
    await waitFor(
      () => {
        expect(screen.getByText("No indicators match these filters")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });
});
