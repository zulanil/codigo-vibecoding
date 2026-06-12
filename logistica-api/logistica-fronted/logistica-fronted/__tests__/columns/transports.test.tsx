import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { getTransportColumns } from "@/components/transports/TransportColumns";
import { renderWithQuery } from "@/test/utils/renderWithQuery";
import type { Transport } from "@/lib/types";

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

const makeTransport = (
  overrides: Partial<Transport> = {}
): Transport => ({
  id: 1,
  driver: 3,
  plate_number: "ABC-123",
  vehicle_type: "truck",
  capacity_kg: "8000.00",
  status: "available",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

function ColumnTestTable({
  transport,
  driversMap,
  canEdit = true,
  canDelete = true,
}: {
  transport: Transport;
  driversMap: Map<number, string>;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const columns = getTransportColumns(driversMap, canEdit, canDelete);
  const table = useReactTable({
    data: [transport],
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

describe("getTransportColumns — column keys", () => {
  it("returns 6 columns (plate_number, vehicle_type, capacity_kg, status, driver, actions)", () => {
    expect(getTransportColumns(new Map())).toHaveLength(6);
  });

  it("has correct accessorKeys/ids", () => {
    const keys = getTransportColumns(new Map())
      .map((c) => ("accessorKey" in c ? c.accessorKey : c.id))
      .filter(Boolean);
    expect(keys).toContain("plate_number");
    expect(keys).toContain("vehicle_type");
    expect(keys).toContain("capacity_kg");
    expect(keys).toContain("status");
    expect(keys).toContain("driver");
    expect(keys).toContain("actions");
  });
});

// ── vehicle_type labels ───────────────────────────────────────────────────────

describe("getTransportColumns — vehicle_type cell", () => {
  it("renders 'Camión' for truck", () => {
    renderWithQuery(
      <ColumnTestTable transport={makeTransport({ vehicle_type: "truck" })} driversMap={new Map()} />
    );
    expect(screen.getByText("Camión")).toBeInTheDocument();
  });

  it("renders 'Furgoneta' for van", () => {
    renderWithQuery(
      <ColumnTestTable transport={makeTransport({ vehicle_type: "van" })} driversMap={new Map()} />
    );
    expect(screen.getByText("Furgoneta")).toBeInTheDocument();
  });

  it("renders 'Moto' for motorcycle", () => {
    renderWithQuery(
      <ColumnTestTable transport={makeTransport({ vehicle_type: "motorcycle" })} driversMap={new Map()} />
    );
    expect(screen.getByText("Moto")).toBeInTheDocument();
  });
});

// ── status badges ─────────────────────────────────────────────────────────────

describe("getTransportColumns — status cell", () => {
  it("renders 'Disponible' badge for available", () => {
    renderWithQuery(
      <ColumnTestTable transport={makeTransport({ status: "available" })} driversMap={new Map()} />
    );
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("renders 'En uso' badge for in_use", () => {
    renderWithQuery(
      <ColumnTestTable transport={makeTransport({ status: "in_use" })} driversMap={new Map()} />
    );
    expect(screen.getByText("En uso")).toBeInTheDocument();
  });

  it("renders 'Mantenimiento' badge for maintenance", () => {
    renderWithQuery(
      <ColumnTestTable transport={makeTransport({ status: "maintenance" })} driversMap={new Map()} />
    );
    expect(screen.getByText("Mantenimiento")).toBeInTheDocument();
  });
});

// ── driver cell ───────────────────────────────────────────────────────────────

describe("getTransportColumns — driver cell", () => {
  it("renders 'Sin asignar' when driver is null", () => {
    renderWithQuery(
      <ColumnTestTable transport={makeTransport({ driver: null })} driversMap={new Map()} />
    );
    expect(screen.getByText("Sin asignar")).toBeInTheDocument();
  });

  it("renders driver name from map when id is known", () => {
    const map = new Map([[3, "Ana García (B2-12345678)"]]);
    renderWithQuery(
      <ColumnTestTable transport={makeTransport({ driver: 3 })} driversMap={map} />
    );
    expect(screen.getByText("Ana García (B2-12345678)")).toBeInTheDocument();
  });

  it("renders '#id' fallback when driver id not in map", () => {
    renderWithQuery(
      <ColumnTestTable transport={makeTransport({ driver: 7 })} driversMap={new Map()} />
    );
    expect(screen.getByText("#7")).toBeInTheDocument();
  });
});

// ── Actions column ────────────────────────────────────────────────────────────

describe("getTransportColumns — actions column", () => {
  it("renders edit link with plate_number aria-label", () => {
    const transport = makeTransport();
    renderWithQuery(
      <ColumnTestTable transport={transport} driversMap={new Map()} />
    );
    expect(
      screen.getByRole("link", { name: `Editar ${transport.plate_number}` })
    ).toHaveAttribute("href", `/transports/${transport.id}`);
  });

  it("hides edit link when canEdit is false", () => {
    const transport = makeTransport();
    renderWithQuery(
      <ColumnTestTable transport={transport} driversMap={new Map()} canEdit={false} />
    );
    expect(
      screen.queryByRole("link", { name: `Editar ${transport.plate_number}` })
    ).not.toBeInTheDocument();
  });
});
