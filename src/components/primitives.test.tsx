import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Badge } from "./Badge";
import { Card, CardHeader, CardTitle } from "./Card";
import { Avatar } from "./Avatar";
import { Spinner } from "./Spinner";
import { Skeleton } from "./Skeleton";
import { Checkbox } from "./Checkbox";
import { Select } from "./Select";
import { Textarea } from "./Textarea";
import { Input } from "./Input";
import { Tabs } from "./Tabs";
import { Breadcrumbs } from "./Breadcrumbs";
import { Pagination } from "./Pagination";
import { AlertBanner } from "./Alert";
import { Dropdown } from "./Dropdown";
import { EmptyState } from "./EmptyState";
import { StatTile } from "./StatTile";

describe("design system primitives (smoke)", () => {
  it("Badge renders its content", () => {
    render(<Badge tone="success">Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("Card renders header, title, and children", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Panel title</CardTitle>
        </CardHeader>
        <p>Body content</p>
      </Card>,
    );
    expect(screen.getByText("Panel title")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("Avatar renders deterministic initials", () => {
    render(<Avatar name="Avery Chen" seed="user_1" />);
    expect(screen.getByText("AC")).toBeInTheDocument();
  });

  it("Spinner announces a loading status", () => {
    render(<Spinner label="Loading incidents" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("Skeleton renders as a hidden placeholder", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("Checkbox toggles when clicked", async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Enable MFA" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText("Enable MFA"));
    expect(onChange).toHaveBeenCalled();
  });

  it("Select lists the provided options", () => {
    render(
      <Select
        label="Severity"
        options={[
          { value: "high", label: "High" },
          { value: "low", label: "Low" },
        ]}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Severity" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "High" })).toBeInTheDocument();
  });

  it("Textarea renders with its label", () => {
    render(<Textarea label="Notes" />);
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
  });

  it("Input shows a validation error", () => {
    render(<Input label="Email" error="Enter a valid email address" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address");
  });

  it("Tabs marks the active tab as selected", () => {
    render(
      <Tabs
        items={[
          { id: "a", label: "Overview" },
          { id: "b", label: "Timeline" },
        ]}
        activeId="a"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Timeline" })).toHaveAttribute("aria-selected", "false");
  });

  it("Tabs arrow-key navigation moves focus through every tab, not just the first two", async () => {
    // Regression test: selecting a tab used to update `activeId` without
    // moving DOM focus, so the keydown handler stayed bound to the
    // original button and ArrowRight could never advance past the second
    // tab. Any change that decouples "selected" from "focused" again
    // should fail this.
    function ControlledTabs() {
      const [activeId, setActiveId] = useState("a");
      return (
        <Tabs
          items={[
            { id: "a", label: "Alpha" },
            { id: "b", label: "Bravo" },
            { id: "c", label: "Charlie" },
          ]}
          activeId={activeId}
          onChange={setActiveId}
        />
      );
    }
    render(<ControlledTabs />);
    screen.getByRole("tab", { name: "Alpha" }).focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Bravo" })).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    const charlie = screen.getByRole("tab", { name: "Charlie" });
    expect(charlie).toHaveFocus();
    expect(charlie).toHaveAttribute("aria-selected", "true");
  });

  it("Breadcrumbs marks the last item as the current page", () => {
    render(
      <MemoryRouter>
        <Breadcrumbs items={[{ label: "Incidents", path: "/app/incidents" }, { label: "INC-1" }]} />
      </MemoryRouter>,
    );
    expect(screen.getByText("INC-1")).toHaveAttribute("aria-current", "page");
  });

  it("Pagination renders nothing when there are no results", () => {
    const { container } = render(
      <Pagination page={1} pageSize={10} total={0} onPageChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("Pagination shows the current range", () => {
    render(<Pagination page={2} pageSize={10} total={25} onPageChange={vi.fn()} />);
    expect(screen.getByText(/11–20/)).toBeInTheDocument();
  });

  it("AlertBanner renders its title and is dismissible", async () => {
    const onDismiss = vi.fn();
    render(<AlertBanner tone="warning" title="Heads up" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("Dropdown opens its menu and fires onSelect", async () => {
    const onSelect = vi.fn();
    render(<Dropdown trigger={<span>Actions</span>} items={[{ label: "Delete", onSelect }]} />);
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onSelect).toHaveBeenCalled();
  });

  it("Dropdown returns focus to the trigger when closed with Escape", async () => {
    // Regression test: closing via Escape used to just unmount the menu,
    // so a menu item that held focus dropped it to <body> and keyboard
    // users lost their place on the page.
    render(<Dropdown trigger={<span>Actions</span>} items={[{ label: "Delete", onSelect: vi.fn() }]} />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    await userEvent.click(trigger);
    screen.getByRole("menuitem", { name: "Delete" }).focus();

    await userEvent.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });

  it("EmptyState renders title and description", () => {
    render(<EmptyState icon="inbox" title="No incidents" description="You're all caught up." />);
    expect(screen.getByText("No incidents")).toBeInTheDocument();
    expect(screen.getByText("You're all caught up.")).toBeInTheDocument();
  });

  it("StatTile renders its label while loading", () => {
    render(<StatTile label="Open incidents" icon="fire" loading />);
    expect(screen.getByText("Open incidents")).toBeInTheDocument();
  });
});
