import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { getSupplierColumns } from "@/components/suppliers/SupplierColumns";
import type { Supplier } from "@/lib/types";

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

const mockSupplier: Supplier = {
  id: 7,
  name: "Tech Supplies S.A.",
  contact_name: "Ana García",
  email: "ana@techsupplies.com",
  phone: "+57 300 000 0001",
  address: "Calle 123",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

function ColumnTestTable({
  supplier,
  onDelete,
  canEdit = true,
  canDelete = true,
}: {
  supplier: Supplier;
  onDelete: (s: Supplier) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const columns = getSupplierColumns(onDelete, canEdit, canDelete);
  const table = useReactTable({
    data: [supplier],
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

describe("getSupplierColumns — column keys", () => {
  it("returns 5 columns (name, contact_name, email, phone, actions)", () => {
    const columns = getSupplierColumns(vi.fn());
    expect(columns).toHaveLength(5);
  });

  it("has correct accessorKeys", () => {
    const columns = getSupplierColumns(vi.fn());
    const keys = columns
      .map((c) => ("accessorKey" in c ? c.accessorKey : c.id))
      .filter(Boolean);
    expect(keys).toContain("name");
    expect(keys).toContain("contact_name");
    expect(keys).toContain("email");
    expect(keys).toContain("phone");
    expect(keys).toContain("actions");
  });
});

// ── Data cells ────────────────────────────────────────────────────────────────

describe("getSupplierColumns — data rendering", () => {
  it("renders supplier name in the name column", () => {
    render(<ColumnTestTable supplier={mockSupplier} onDelete={vi.fn()} />);
    expect(screen.getByText("Tech Supplies S.A.")).toBeInTheDocument();
  });

  it("renders contact_name", () => {
    render(<ColumnTestTable supplier={mockSupplier} onDelete={vi.fn()} />);
    expect(screen.getByText("Ana García")).toBeInTheDocument();
  });

  it("renders email", () => {
    render(<ColumnTestTable supplier={mockSupplier} onDelete={vi.fn()} />);
    expect(screen.getByText("ana@techsupplies.com")).toBeInTheDocument();
  });

  it("renders phone", () => {
    render(<ColumnTestTable supplier={mockSupplier} onDelete={vi.fn()} />);
    expect(screen.getByText("+57 300 000 0001")).toBeInTheDocument();
  });
});

// ── Actions column ────────────────────────────────────────────────────────────

describe("getSupplierColumns — actions column", () => {
  it("renders edit link pointing to /suppliers/:id", () => {
    render(<ColumnTestTable supplier={mockSupplier} onDelete={vi.fn()} />);
    const editLink = screen.getByRole("link", {
      name: `Editar ${mockSupplier.name}`,
    });
    expect(editLink).toHaveAttribute("href", `/suppliers/${mockSupplier.id}`);
  });

  it("calls onDelete with the supplier when delete button clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<ColumnTestTable supplier={mockSupplier} onDelete={onDelete} />);
    const deleteBtn = screen.getByRole("button", {
      name: `Eliminar ${mockSupplier.name}`,
    });
    await user.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(mockSupplier);
  });

  it("hides edit link when canEdit is false", () => {
    render(
      <ColumnTestTable
        supplier={mockSupplier}
        onDelete={vi.fn()}
        canEdit={false}
      />
    );
    expect(
      screen.queryByRole("link", { name: `Editar ${mockSupplier.name}` })
    ).not.toBeInTheDocument();
  });

  it("hides delete button when canDelete is false", () => {
    render(
      <ColumnTestTable
        supplier={mockSupplier}
        onDelete={vi.fn()}
        canDelete={false}
      />
    );
    expect(
      screen.queryByRole("button", { name: `Eliminar ${mockSupplier.name}` })
    ).not.toBeInTheDocument();
  });

  it("hides both actions when canEdit and canDelete are false", () => {
    render(
      <ColumnTestTable
        supplier={mockSupplier}
        onDelete={vi.fn()}
        canEdit={false}
        canDelete={false}
      />
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
