import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { getCustomerColumns } from "@/components/customers/CustomerColumns";
import type { Customer } from "@/lib/types";

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

const companyCustomer: Customer = {
  id: 3,
  user: null,
  name: "Carlos López",
  company_name: "TechCorp S.A.",
  customer_type: "company",
  email: "carlos@techcorp.com",
  phone: "+57 300 111 2222",
  address: "Av. El Dorado #68-00",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const individualCustomer: Customer = {
  ...companyCustomer,
  id: 4,
  name: "María Pérez",
  company_name: "",
  customer_type: "individual",
};

function ColumnTestTable({
  customer,
  onDelete,
  canEdit = true,
  canDelete = true,
}: {
  customer: Customer;
  onDelete: (c: Customer) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const columns = getCustomerColumns(onDelete, canEdit, canDelete);
  const table = useReactTable({
    data: [customer],
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

describe("getCustomerColumns — column keys", () => {
  it("returns 6 columns (name, company_name, customer_type, email, phone, actions)", () => {
    expect(getCustomerColumns(vi.fn())).toHaveLength(6);
  });

  it("has correct accessorKeys", () => {
    const keys = getCustomerColumns(vi.fn())
      .map((c) => ("accessorKey" in c ? c.accessorKey : c.id))
      .filter(Boolean);
    expect(keys).toContain("name");
    expect(keys).toContain("company_name");
    expect(keys).toContain("customer_type");
    expect(keys).toContain("email");
    expect(keys).toContain("phone");
    expect(keys).toContain("actions");
  });
});

// ── customer_type badge ───────────────────────────────────────────────────────

describe("getCustomerColumns — customer_type cell", () => {
  it("renders 'Empresa' badge for company customer", () => {
    render(<ColumnTestTable customer={companyCustomer} onDelete={vi.fn()} />);
    expect(screen.getByText("Empresa")).toBeInTheDocument();
  });

  it("renders 'Individual' badge for individual customer", () => {
    render(<ColumnTestTable customer={individualCustomer} onDelete={vi.fn()} />);
    expect(screen.getByText("Individual")).toBeInTheDocument();
  });
});

// ── company_name fallback ─────────────────────────────────────────────────────

describe("getCustomerColumns — company_name cell", () => {
  it("renders company_name when present", () => {
    render(<ColumnTestTable customer={companyCustomer} onDelete={vi.fn()} />);
    expect(screen.getByText("TechCorp S.A.")).toBeInTheDocument();
  });

  it("renders '—' when company_name is empty string", () => {
    render(<ColumnTestTable customer={individualCustomer} onDelete={vi.fn()} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

// ── Actions column ────────────────────────────────────────────────────────────

describe("getCustomerColumns — actions column", () => {
  it("renders edit link pointing to /customers/:id", () => {
    render(<ColumnTestTable customer={companyCustomer} onDelete={vi.fn()} />);
    const editLink = screen.getByRole("link", {
      name: `Editar ${companyCustomer.name}`,
    });
    expect(editLink).toHaveAttribute("href", `/customers/${companyCustomer.id}`);
  });

  it("calls onDelete with the customer when delete button clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<ColumnTestTable customer={companyCustomer} onDelete={onDelete} />);
    await user.click(
      screen.getByRole("button", { name: `Eliminar ${companyCustomer.name}` })
    );
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(companyCustomer);
  });

  it("hides edit link when canEdit is false", () => {
    render(
      <ColumnTestTable customer={companyCustomer} onDelete={vi.fn()} canEdit={false} />
    );
    expect(
      screen.queryByRole("link", { name: `Editar ${companyCustomer.name}` })
    ).not.toBeInTheDocument();
  });

  it("hides delete button when canDelete is false", () => {
    render(
      <ColumnTestTable customer={companyCustomer} onDelete={vi.fn()} canDelete={false} />
    );
    expect(
      screen.queryByRole("button", { name: `Eliminar ${companyCustomer.name}` })
    ).not.toBeInTheDocument();
  });
});
