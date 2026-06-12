import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { getWarehouseColumns } from "@/components/warehouses/WarehouseColumns";
import type { Warehouse } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

const mockWarehouse: Warehouse = {
  id: 5,
  name: "Bodega Central",
  address: "Calle 1 #2-3",
  city: "Bogotá",
  country: "Colombia",
  capacity_kg: "5000.00",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

function ColumnTestTable({
  warehouse,
  onDelete,
  canEdit = true,
  canDelete = true,
}: {
  warehouse: Warehouse;
  onDelete: (w: Warehouse) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const columns = getWarehouseColumns(onDelete, canEdit, canDelete);
  const table = useReactTable({
    data: [warehouse],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} data-column={cell.column.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Column definitions ────────────────────────────────────────────────────────

describe("getWarehouseColumns — column keys", () => {
  it("returns 5 columns (name, city, country, capacity_kg, actions)", () => {
    const columns = getWarehouseColumns(vi.fn());
    expect(columns).toHaveLength(5);
  });

  it("has correct accessorKeys", () => {
    const columns = getWarehouseColumns(vi.fn());
    const keys = columns
      .map((c) => ("accessorKey" in c ? c.accessorKey : c.id))
      .filter(Boolean);
    expect(keys).toContain("name");
    expect(keys).toContain("city");
    expect(keys).toContain("country");
    expect(keys).toContain("capacity_kg");
    expect(keys).toContain("actions");
  });
});

// ── Data cells ────────────────────────────────────────────────────────────────

describe("getWarehouseColumns — data rendering", () => {
  it("renders warehouse name", () => {
    render(<ColumnTestTable warehouse={mockWarehouse} onDelete={vi.fn()} />);
    expect(screen.getByText("Bodega Central")).toBeInTheDocument();
  });

  it("renders city", () => {
    render(<ColumnTestTable warehouse={mockWarehouse} onDelete={vi.fn()} />);
    expect(screen.getByText("Bogotá")).toBeInTheDocument();
  });

  it("renders country", () => {
    render(<ColumnTestTable warehouse={mockWarehouse} onDelete={vi.fn()} />);
    expect(screen.getByText("Colombia")).toBeInTheDocument();
  });

  it("renders capacity_kg as string (DecimalField from DRF)", () => {
    render(<ColumnTestTable warehouse={mockWarehouse} onDelete={vi.fn()} />);
    expect(screen.getByText("5000.00")).toBeInTheDocument();
  });
});

// ── Actions column ────────────────────────────────────────────────────────────

describe("getWarehouseColumns — actions column", () => {
  it("renders edit link pointing to /warehouses/:id", () => {
    render(<ColumnTestTable warehouse={mockWarehouse} onDelete={vi.fn()} />);
    const editLink = screen.getByRole("link", {
      name: `Editar ${mockWarehouse.name}`,
    });
    expect(editLink).toHaveAttribute("href", `/warehouses/${mockWarehouse.id}`);
  });

  it("calls onDelete with the warehouse when delete button clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<ColumnTestTable warehouse={mockWarehouse} onDelete={onDelete} />);
    await user.click(
      screen.getByRole("button", { name: `Eliminar ${mockWarehouse.name}` })
    );
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(mockWarehouse);
  });

  it("hides edit link when canEdit is false", () => {
    render(
      <ColumnTestTable warehouse={mockWarehouse} onDelete={vi.fn()} canEdit={false} />
    );
    expect(
      screen.queryByRole("link", { name: `Editar ${mockWarehouse.name}` })
    ).not.toBeInTheDocument();
  });

  it("hides delete button when canDelete is false", () => {
    render(
      <ColumnTestTable warehouse={mockWarehouse} onDelete={vi.fn()} canDelete={false} />
    );
    expect(
      screen.queryByRole("button", { name: `Eliminar ${mockWarehouse.name}` })
    ).not.toBeInTheDocument();
  });

  it("hides both actions when canEdit and canDelete are false", () => {
    render(
      <ColumnTestTable
        warehouse={mockWarehouse}
        onDelete={vi.fn()}
        canEdit={false}
        canDelete={false}
      />
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
