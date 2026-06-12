import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { getProductColumns } from "@/components/products/ProductColumns";
import type { Product } from "@/lib/types";

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

const mockProduct: Product = {
  id: 10,
  supplier: 2,
  name: "Laptop Pro 15",
  sku: "LAP-PRO-15",
  description: "Laptop de alto rendimiento",
  weight_kg: "2.500",
  length_cm: "35.00",
  width_cm: "24.00",
  height_cm: "2.00",
  unit_price: "1500.00",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

function ColumnTestTable({
  product,
  suppliersMap,
  onDelete,
  canEdit = true,
  canDelete = true,
}: {
  product: Product;
  suppliersMap: Map<number, string>;
  onDelete: (p: Product) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const columns = getProductColumns(suppliersMap, onDelete, canEdit, canDelete);
  const table = useReactTable({
    data: [product],
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

describe("getProductColumns — column keys", () => {
  it("returns 6 columns (sku, name, supplier, weight_kg, unit_price, actions)", () => {
    expect(getProductColumns(new Map(), vi.fn())).toHaveLength(6);
  });

  it("has correct accessorKeys", () => {
    const keys = getProductColumns(new Map(), vi.fn())
      .map((c) => ("accessorKey" in c ? c.accessorKey : c.id))
      .filter(Boolean);
    expect(keys).toContain("sku");
    expect(keys).toContain("name");
    expect(keys).toContain("supplier");
    expect(keys).toContain("weight_kg");
    expect(keys).toContain("unit_price");
    expect(keys).toContain("actions");
  });
});

// ── Supplier cell with suppliersMap ───────────────────────────────────────────

describe("getProductColumns — supplier cell", () => {
  it("renders supplier name when id is in the map", () => {
    const map = new Map([[2, "Tech Supplies S.A."]]);
    render(
      <ColumnTestTable
        product={mockProduct}
        suppliersMap={map}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText("Tech Supplies S.A.")).toBeInTheDocument();
  });

  it("renders '#id' fallback when supplier id not in map", () => {
    render(
      <ColumnTestTable
        product={mockProduct}
        suppliersMap={new Map()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText(`#${mockProduct.supplier}`)).toBeInTheDocument();
  });
});

// ── Data cells ────────────────────────────────────────────────────────────────

describe("getProductColumns — data rendering", () => {
  const map = new Map([[2, "Tech Supplies S.A."]]);

  it("renders SKU", () => {
    render(<ColumnTestTable product={mockProduct} suppliersMap={map} onDelete={vi.fn()} />);
    expect(screen.getByText("LAP-PRO-15")).toBeInTheDocument();
  });

  it("renders product name", () => {
    render(<ColumnTestTable product={mockProduct} suppliersMap={map} onDelete={vi.fn()} />);
    expect(screen.getByText("Laptop Pro 15")).toBeInTheDocument();
  });

  it("renders weight_kg as string from DRF", () => {
    render(<ColumnTestTable product={mockProduct} suppliersMap={map} onDelete={vi.fn()} />);
    expect(screen.getByText("2.500")).toBeInTheDocument();
  });

  it("renders unit_price as string from DRF", () => {
    render(<ColumnTestTable product={mockProduct} suppliersMap={map} onDelete={vi.fn()} />);
    expect(screen.getByText("1500.00")).toBeInTheDocument();
  });
});

// ── Actions column ────────────────────────────────────────────────────────────

describe("getProductColumns — actions column", () => {
  const map = new Map([[2, "Tech Supplies S.A."]]);

  it("renders edit link pointing to /products/:id", () => {
    render(<ColumnTestTable product={mockProduct} suppliersMap={map} onDelete={vi.fn()} />);
    expect(
      screen.getByRole("link", { name: `Editar ${mockProduct.name}` })
    ).toHaveAttribute("href", `/products/${mockProduct.id}`);
  });

  it("calls onDelete with the product when delete button clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <ColumnTestTable product={mockProduct} suppliersMap={map} onDelete={onDelete} />
    );
    await user.click(
      screen.getByRole("button", { name: `Eliminar ${mockProduct.name}` })
    );
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(mockProduct);
  });

  it("hides edit link when canEdit is false", () => {
    render(
      <ColumnTestTable
        product={mockProduct}
        suppliersMap={map}
        onDelete={vi.fn()}
        canEdit={false}
      />
    );
    expect(
      screen.queryByRole("link", { name: `Editar ${mockProduct.name}` })
    ).not.toBeInTheDocument();
  });

  it("hides delete button when canDelete is false", () => {
    render(
      <ColumnTestTable
        product={mockProduct}
        suppliersMap={map}
        onDelete={vi.fn()}
        canDelete={false}
      />
    );
    expect(
      screen.queryByRole("button", { name: `Eliminar ${mockProduct.name}` })
    ).not.toBeInTheDocument();
  });
});
