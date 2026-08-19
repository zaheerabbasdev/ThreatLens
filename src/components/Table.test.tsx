import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Table, type TableColumn } from "./Table";

interface Row {
  id: string;
  name: string;
}

const columns: TableColumn<Row>[] = [{ key: "name", header: "Name", render: (row) => row.name }];

describe("Table", () => {
  it("shows an empty state when there is no data", () => {
    render(<Table columns={columns} data={[]} getRowId={(r) => r.id} emptyTitle="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders skeleton rows while loading, not the empty state", () => {
    render(
      <Table columns={columns} data={[]} getRowId={(r) => r.id} loading emptyTitle="Nothing here" />,
    );
    expect(screen.queryByText("Nothing here")).not.toBeInTheDocument();
  });

  it("renders a row per data item", () => {
    const data: Row[] = [
      { id: "1", name: "First" },
      { id: "2", name: "Second" },
    ];
    render(<Table columns={columns} data={data} getRowId={(r) => r.id} />);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("calls onRowClick when a row is clicked", async () => {
    const onRowClick = vi.fn();
    const data: Row[] = [{ id: "1", name: "First" }];
    render(<Table columns={columns} data={data} getRowId={(r) => r.id} onRowClick={onRowClick} />);
    await userEvent.click(screen.getByText("First"));
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });
});
