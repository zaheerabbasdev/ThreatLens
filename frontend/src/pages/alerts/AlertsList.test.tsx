import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertsList } from "./AlertsList";
import { renderWithProviders } from "@/testUtils";

describe("AlertsList", () => {
  it("renders alerts once loaded", async () => {
    renderWithProviders(<AlertsList />);
    await waitFor(
      () => {
        expect(screen.getByText(/Multiple failed MFA challenges/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("shows an empty state when no alert matches the search", async () => {
    renderWithProviders(<AlertsList />);
    const search = await screen.findByPlaceholderText("Search alerts…");
    await userEvent.type(search, "zzz-no-such-alert");
    await waitFor(
      () => {
        expect(screen.getByText("No alerts match these filters")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });
});
