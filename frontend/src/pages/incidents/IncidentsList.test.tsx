import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IncidentsList } from "./IncidentsList";
import { renderWithProviders } from "@/testUtils";

describe("IncidentsList", () => {
  it("renders incidents once loaded", async () => {
    renderWithProviders(<IncidentsList />);
    await waitFor(
      () => {
        expect(screen.getByText(/Credential-harvesting phishing campaign/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("shows an empty state when no incident matches the search", async () => {
    renderWithProviders(<IncidentsList />);
    const search = await screen.findByPlaceholderText("Search incidents…");
    await userEvent.type(search, "zzz-no-such-incident");
    await waitFor(
      () => {
        expect(screen.getByText("No incidents match these filters")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });
});
