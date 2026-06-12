import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { getDriverColumns } from "@/components/drivers/DriverColumns";
import type { Driver } from "@/lib/types";

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

const makeDriver = (status: Driver["status"]): Driver => ({
  id: 1,
  user: 5,
  license_number: "B2-12345678",
  phone: "+57 300 555 1234",
  status,
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
});

function ColumnTestTable({
  driver,
  onDelete,
  canEdit = true,
  canDelete = true,
}: {
  driver: Driver;
  onDelete: (d: Driver) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const columns = getDriverColumns(onDelete, canEdit, canDelete);
  const table = useReactTable({
    data: [driver],
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

describe("getDriverColumns — column keys", () => {
  it("returns 4 columns (license_number, phone, status, actions)", () => {
    expect(getDriverColumns(vi.fn())).toHaveLength(4);
  });

  it("has correct accessorKeys/ids", () => {
    const keys = getDriverColumns(vi.fn())
      .map((c) => ("accessorKey" in c ? c.accessorKey : c.id))
      .filter(Boolean);
    expect(keys).toContain("license_number");
    expect(keys).toContain("phone");
    expect(keys).toContain("status");
    expect(keys).toContain("actions");
  });
});

// ── Status badge ──────────────────────────────────────────────────────────────

describe("getDriverColumns — status cell", () => {
  it("renders 'Disponible' badge for available driver", () => {
    render(<ColumnTestTable driver={makeDriver("available")} onDelete={vi.fn()} />);
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("renders 'En ruta' badge for on_route driver", () => {
    render(<ColumnTestTable driver={makeDriver("on_route")} onDelete={vi.fn()} />);
    expect(screen.getByText("En ruta")).toBeInTheDocument();
  });

  it("renders 'No disponible' badge for off_duty driver", () => {
    render(<ColumnTestTable driver={makeDriver("off_duty")} onDelete={vi.fn()} />);
    expect(screen.getByText("No disponible")).toBeInTheDocument();
  });
});

// ── Data cells ────────────────────────────────────────────────────────────────

describe("getDriverColumns — data rendering", () => {
  const driver = makeDriver("available");

  it("renders license_number", () => {
    render(<ColumnTestTable driver={driver} onDelete={vi.fn()} />);
    expect(screen.getByText("B2-12345678")).toBeInTheDocument();
  });

  it("renders phone", () => {
    render(<ColumnTestTable driver={driver} onDelete={vi.fn()} />);
    expect(screen.getByText("+57 300 555 1234")).toBeInTheDocument();
  });
});

// ── Actions column ────────────────────────────────────────────────────────────

describe("getDriverColumns — actions column", () => {
  const driver = makeDriver("available");

  it("renders edit link pointing to /drivers/:id with license_number aria-label", () => {
    render(<ColumnTestTable driver={driver} onDelete={vi.fn()} />);
    const editLink = screen.getByRole("link", {
      name: `Editar conductor ${driver.license_number}`,
    });
    expect(editLink).toHaveAttribute("href", `/drivers/${driver.id}`);
  });

  it("calls onDelete when delete button clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<ColumnTestTable driver={driver} onDelete={onDelete} />);
    await user.click(
      screen.getByRole("button", {
        name: `Eliminar conductor ${driver.license_number}`,
      })
    );
    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(driver);
  });

  it("hides edit link when canEdit is false", () => {
    render(
      <ColumnTestTable driver={driver} onDelete={vi.fn()} canEdit={false} />
    );
    expect(
      screen.queryByRole("link", {
        name: `Editar conductor ${driver.license_number}`,
      })
    ).not.toBeInTheDocument();
  });

  it("hides delete button when canDelete is false", () => {
    render(
      <ColumnTestTable driver={driver} onDelete={vi.fn()} canDelete={false} />
    );
    expect(
      screen.queryByRole("button", {
        name: `Eliminar conductor ${driver.license_number}`,
      })
    ).not.toBeInTheDocument();
  });
});
