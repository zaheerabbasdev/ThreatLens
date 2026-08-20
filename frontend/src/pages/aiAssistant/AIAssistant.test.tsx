import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AIAssistant } from "./AIAssistant";
import { renderWithProviders, signInAs } from "@/testUtils";

describe("AIAssistant", () => {
  it("shows the empty state with suggested prompts before any message is sent", async () => {
    signInAs();
    renderWithProviders(<AIAssistant />);
    expect(await screen.findByText(/Ask the assistant about your environment/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Why is INC-1 high risk?" })).toBeInTheDocument();
  });

  it("sends a typed question and renders the assistant's reply", async () => {
    signInAs();
    renderWithProviders(<AIAssistant />);

    const input = await screen.findByPlaceholderText("Ask about an incident, indicator, or technique…");
    await userEvent.type(input, "Summarize INC-1");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Summarize INC-1")).toBeInTheDocument();
    await waitFor(
      () => {
        expect(screen.getByText(/Credential-harvesting phishing campaign targeting finance/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
    expect(screen.getByText("AI-generated")).toBeInTheDocument();
  });

  it("sends a suggested prompt when clicked", async () => {
    signInAs();
    renderWithProviders(<AIAssistant />);

    const prompt = await screen.findByRole("button", { name: "Show me unusual login activity" });
    await userEvent.click(prompt);

    expect(await screen.findByText("Show me unusual login activity")).toBeInTheDocument();
    await waitFor(
      () => {
        expect(screen.getByText(/behavioral findings/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });
});
