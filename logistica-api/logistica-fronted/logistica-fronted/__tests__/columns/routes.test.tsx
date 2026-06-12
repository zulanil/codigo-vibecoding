import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { getRouteColumns } from "@/components/routes/RouteColumns";
import { renderWithQuery } from "@/test/utils/renderWithQuery";
import type { Route } from "@/lib/types";

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

const makeRoute = (overrides: Partial<Route> = {}): Route => ({
  id: 1,
  transport: 2,
  origin_warehouse: 3,
  name: "Ruta Bogotá Norte",
  status: "planned",
  scheduled_date: "2024-06-01",
  stops: [
    {
      id: 10,
      stop_order: 1,
      address: "Calle 1",
      city: "Bogotá",
      estimated_arrival: null,
      actual_arrival: null,
    },
    {
      id: 11,
      stop_order: 2,
      address: "Calle 2",
      city: "Bogotá",
      estimated_arrival: null,
      actual_arrival: null,
    },
  ],
  is_active: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

function ColumnTestTable({
  route,
  transportsMap,
  warehousesMap,
  canEdit = true,
  canDelete = true,
}: {
  route: Route;
  transportsMap: Map<number, string>;
  warehousesMap: Map<number, string>;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const columns = getRouteColumns(transportsMap, warehousesMap, canEdit, canDelete);
  const table = useReactTable({
    data: [route],
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

describe("getRouteColumns — column keys", () => {
  it("returns 7 columns", () => {
    expect(getRouteColumns(new Map(), new Map())).toHaveLength(7);
  });

  it("includes expected accessorKeys/ids", () => {
    const keys = getRouteColumns(new Map(), new Map())
      .map((c) => ("accessorKey" in c ? c.accessorKey : c.id))
      .filter(Boolean);
    expect(keys).toContain("name");
    expect(keys).toContain("status");
    expect(keys).toContain("scheduled_date");
    expect(keys).toContain("transport");
    expect(keys).toContain("origin_warehouse");
    expect(keys).toContain("stops");
    expect(keys).toContain("actions");
  });
});

// ── Status badges ─────────────────────────────────────────────────────────────

describe("getRouteColumns — status cell", () => {
  it("renders 'Planificada' for planned", () => {
    renderWithQuery(
      <ColumnTestTable route={makeRoute({ status: "planned" })} transportsMap={new Map()} warehousesMap={new Map()} />
    );
    expect(screen.getByText("Planificada")).toBeInTheDocument();
  });

  it("renders 'En progreso' for in_progress", () => {
    renderWithQuery(
      <ColumnTestTable route={makeRoute({ status: "in_progress" })} transportsMap={new Map()} warehousesMap={new Map()} />
    );
    expect(screen.getByText("En progreso")).toBeInTheDocument();
  });

  it("renders 'Completada' for completed", () => {
    renderWithQuery(
      <ColumnTestTable route={makeRoute({ status: "completed" })} transportsMap={new Map()} warehousesMap={new Map()} />
    );
    expect(screen.getByText("Completada")).toBeInTheDocument();
  });

  it("renders 'Cancelada' for cancelled", () => {
    renderWithQuery(
      <ColumnTestTable route={makeRoute({ status: "cancelled" })} transportsMap={new Map()} warehousesMap={new Map()} />
    );
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
  });
});

// ── Transport and warehouse cells ─────────────────────────────────────────────

describe("getRouteColumns — transport cell", () => {
  it("renders transport name from map", () => {
    const transportsMap = new Map([[2, "ABC-123"]]);
    renderWithQuery(
      <ColumnTestTable route={makeRoute()} transportsMap={transportsMap} warehousesMap={new Map()} />
    );
    expect(screen.getByText("ABC-123")).toBeInTheDocument();
  });

  it("renders transport id as string fallback", () => {
    renderWithQuery(
      <ColumnTestTable route={makeRoute({ transport: 99 })} transportsMap={new Map()} warehousesMap={new Map()} />
    );
    expect(screen.getByText("99")).toBeInTheDocument();
  });
});

describe("getRouteColumns — origin_warehouse cell", () => {
  it("renders warehouse name from map", () => {
    const warehousesMap = new Map([[3, "Bodega Central"]]);
    renderWithQuery(
      <ColumnTestTable route={makeRoute()} transportsMap={new Map()} warehousesMap={warehousesMap} />
    );
    expect(screen.getByText("Bodega Central")).toBeInTheDocument();
  });

  it("renders warehouse id as string fallback", () => {
    renderWithQuery(
      <ColumnTestTable route={makeRoute({ origin_warehouse: 88 })} transportsMap={new Map()} warehousesMap={new Map()} />
    );
    expect(screen.getByText("88")).toBeInTheDocument();
  });
});

// ── Stops count cell ──────────────────────────────────────────────────────────

describe("getRouteColumns — stops cell", () => {
  it("renders count of stops (makeRoute has 2)", () => {
    const { container } = renderWithQuery(
      <ColumnTestTable route={makeRoute()} transportsMap={new Map()} warehousesMap={new Map()} />
    );
    const stopsCell = container.querySelector('[data-column="stops"]');
    expect(stopsCell).toHaveTextContent("2");
  });

  it("renders 0 when route has no stops", () => {
    const { container } = renderWithQuery(
      <ColumnTestTable route={makeRoute({ stops: [] })} transportsMap={new Map()} warehousesMap={new Map()} />
    );
    const stopsCell = container.querySelector('[data-column="stops"]');
    expect(stopsCell).toHaveTextContent("0");
  });
});

// ── Actions column ────────────────────────────────────────────────────────────

describe("getRouteColumns — actions column", () => {
  it("renders edit link with route name aria-label", () => {
    const route = makeRoute();
    renderWithQuery(
      <ColumnTestTable route={route} transportsMap={new Map()} warehousesMap={new Map()} />
    );
    expect(
      screen.getByRole("link", { name: `Editar ${route.name}` })
    ).toHaveAttribute("href", `/routes/${route.id}`);
  });

  it("hides edit link when canEdit is false", () => {
    const route = makeRoute();
    renderWithQuery(
      <ColumnTestTable route={route} transportsMap={new Map()} warehousesMap={new Map()} canEdit={false} />
    );
    expect(
      screen.queryByRole("link", { name: `Editar ${route.name}` })
    ).not.toBeInTheDocument();
  });
});
