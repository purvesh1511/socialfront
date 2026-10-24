import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table, type Column } from "@/components/ui";

interface Row {
  id: number;
  name: string;
}

const columns: Column<Row>[] = [{ key: "name", header: "Name", cell: (row) => row.name }];

describe("Table", () => {
  it("renders rows", () => {
    render(<Table columns={columns} rows={[{ id: 1, name: "Alice" }]} rowKey={(row) => row.id} />);
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Alice" })).toBeInTheDocument();
  });

  it("renders the loading state", () => {
    render(<Table columns={columns} rows={undefined} rowKey={(row) => row.id} isLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });

  it("renders the empty state", () => {
    render(
      <Table columns={columns} rows={[]} rowKey={(row) => row.id} emptyTitle="No customers" />,
    );
    expect(screen.getByText("No customers")).toBeInTheDocument();
  });

  it("renders the error state", () => {
    render(
      <Table
        columns={columns}
        rows={undefined}
        rowKey={(row) => row.id}
        error={new Error("boom")}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
