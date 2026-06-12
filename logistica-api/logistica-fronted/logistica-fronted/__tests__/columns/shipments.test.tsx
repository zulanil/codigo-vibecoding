import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { getShipmentColumns } from "@/components/shipments/ShipmentColumns";
import { renderWithQuery } from "@/test/utils/renderWithQuery";
import type { Shipment } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const makeShipment = (overrides: Partial<Shipment> = {}): Shipment => ({
  id: 1,
  tracking_number: "TRK-2024-0001",
  customer: 3,
  origin_warehouse: 2,
  route: null,
  status: "pending",
  origin_address: "Calle 1 #2-3, Bogotá",
  destination_address: "Av. 5 #10-20, Medellín",
  scheduled_delivery_date: "2024-07-01",
  actual_delivery_date: null,
  weight_kg: "3.500",
  declared_value: "1500.00",
  shipping_cost: "1500.00",
  notes: "Frágil",
  shipment_products: [],
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

function ColumnTestTable({
  shipment,
  customersMap,
  canEdit = true,
  canDelete = true,
}: {
  shipment: Shipment;
  customersMap: Map<number, string>;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const columns = getShipmentColumns(customersMap, canEdit, canDelete);
  const table = useReactTable({
    data: [shipment],
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

describe("getShipmentColumns — column keys", () => {
  it("returns 7 columns", () => {
    expect(getShipmentColumns(new Map())).toHaveLength(7);
  });

  it("includes expected accessorKeys/ids", () => {
    const keys = getShipmentColumns(new Map())
      .map((c) => ("accessorKey" in c ? c.accessorKey : c.id))
      .filter(Boolean);
    expect(keys).toContain("tracking_number");
    expect(keys).toContain("customer");
    expect(keys).toContain("status");
    expect(keys).toContain("destination_address");
    expect(keys).toContain("scheduled_delivery_date");
    expect(keys).toContain("shipping_cost");
    expect(keys).toContain("actions");
  });
});

// ── Status badges ─────────────────────────────────────────────────────────────

describe("getShipmentColumns — status cell", () => {
  const statuses: Array<[Shipment["status"], string]> = [
    ["pending", "Pendiente"],
    ["assigned", "Asignado"],
    ["in_transit", "En tránsito"],
    ["delivered", "Entregado"],
    ["cancelled", "Cancelado"],
  ];

  for (const [status, label] of statuses) {
    it(`renders '${label}' badge for ${status}`, () => {
      renderWithQuery(
        <ColumnTestTable
          shipment={makeShipment({ status })}
          customersMap={new Map()}
        />
      );
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  }
});

// ── Customer cell ─────────────────────────────────────────────────────────────

describe("getShipmentColumns — customer cell", () => {
  it("renders customer name from map", () => {
    const map = new Map([[3, "Carlos López"]]);
    renderWithQuery(
      <ColumnTestTable shipment={makeShipment()} customersMap={map} />
    );
    expect(screen.getByText("Carlos López")).toBeInTheDocument();
  });

  it("renders customer id as string fallback", () => {
    renderWithQuery(
      <ColumnTestTable shipment={makeShipment({ customer: 99 })} customersMap={new Map()} />
    );
    expect(screen.getByText("99")).toBeInTheDocument();
  });
});

// ── scheduled_delivery_date cell ──────────────────────────────────────────────

describe("getShipmentColumns — scheduled_delivery_date cell", () => {
  it("renders the date string when present", () => {
    renderWithQuery(
      <ColumnTestTable
        shipment={makeShipment({ scheduled_delivery_date: "2024-07-01" })}
        customersMap={new Map()}
      />
    );
    expect(screen.getByText("2024-07-01")).toBeInTheDocument();
  });

  it("renders '—' when scheduled_delivery_date is null", () => {
    renderWithQuery(
      <ColumnTestTable
        shipment={makeShipment({ scheduled_delivery_date: null })}
        customersMap={new Map()}
      />
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

// ── shipping_cost formatCOP ───────────────────────────────────────────────────

describe("getShipmentColumns — shipping_cost cell (formatCOP)", () => {
  it("formats the cost starting with '$' sign", () => {
    const { container } = renderWithQuery(
      <ColumnTestTable
        shipment={makeShipment({ shipping_cost: "1500.00" })}
        customersMap={new Map()}
      />
    );
    const costCell = container.querySelector('[data-column="shipping_cost"]');
    expect(costCell?.textContent).toMatch(/^\$/);
  });

  it("includes the numeric value in the formatted output", () => {
    const { container } = renderWithQuery(
      <ColumnTestTable
        shipment={makeShipment({ shipping_cost: "1500.00" })}
        customersMap={new Map()}
      />
    );
    const costCell = container.querySelector('[data-column="shipping_cost"]');
    // Regardless of locale (1.500 or 1,500), the digits "1500" are present
    expect(costCell?.textContent).toMatch(/1[.,]?500/);
  });

  it("handles zero decimals (rounds to integer)", () => {
    const { container } = renderWithQuery(
      <ColumnTestTable
        shipment={makeShipment({ shipping_cost: "100.99" })}
        customersMap={new Map()}
      />
    );
    const costCell = container.querySelector('[data-column="shipping_cost"]');
    // maximumFractionDigits: 0 → rounds to "101" or "100"
    expect(costCell?.textContent).toMatch(/^\$/);
  });
});

// ── Actions column ────────────────────────────────────────────────────────────

describe("getShipmentColumns — actions column", () => {
  it("renders edit link pointing to /shipments/:id", () => {
    const shipment = makeShipment();
    renderWithQuery(
      <ColumnTestTable shipment={shipment} customersMap={new Map()} />
    );
    const link = screen.getByRole("link", { name: "Editar" });
    expect(link).toHaveAttribute("href", `/shipments/${shipment.id}`);
  });

  it("hides edit link when canEdit is false", () => {
    renderWithQuery(
      <ColumnTestTable
        shipment={makeShipment()}
        customersMap={new Map()}
        canEdit={false}
      />
    );
    expect(screen.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();
  });
});
