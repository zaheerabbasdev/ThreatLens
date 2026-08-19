import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UsersList } from "./UsersList";
import { renderWithProviders } from "@/testUtils";

describe("UsersList", () => {
  it("renders users once loaded", async () => {
    renderWithProviders(<UsersList />);
    await waitFor(
      () => {
        expect(screen.getByText("Avery Chen")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it("shows an empty state when no user matches the search", async () => {
    renderWithProviders(<UsersList />);
    const search = await screen.findByPlaceholderText("Search by name or email…");
    await userEvent.type(search, "zzz-no-such-user");
    await waitFor(
      () => {
        expect(screen.getByText("No users match these filters")).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });
});
