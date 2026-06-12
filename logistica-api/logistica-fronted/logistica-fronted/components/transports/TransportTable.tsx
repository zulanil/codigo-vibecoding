"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { getTransports } from "@/lib/api/transports";
import { getDrivers } from "@/lib/api/drivers";
import { getTransportColumns } from "./TransportColumns";
import { useModulePermissions } from "@/lib/hooks/usePermission";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const STATUS_FILTERS = [
  { label: "Todos", value: "" },
  { label: "Disponible", value: "available" },
  { label: "En uso", value: "in_use" },
  { label: "Mantenimiento", value: "maintenance" },
];

const VEHICLE_FILTERS = [
  { label: "Todos", value: "" },
  { label: "Camión", value: "truck" },
  { label: "Furgoneta", value: "van" },
  { label: "Moto", value: "motorcycle" },
];

export function TransportTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = searchParams.get("page") ?? "1";
  const search = searchParams.get("search") ?? "";
  const ordering = searchParams.get("ordering") ?? "";
  const status = searchParams.get("status") ?? "";
  const vehicle_type = searchParams.get("vehicle_type") ?? "";

  const [searchInput, setSearchInput] = useState(search);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) updateParams({ search: searchInput, page: "1" });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search, updateParams]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["transports", { page, search, ordering, status, vehicle_type }],
    queryFn: () => getTransports({ page, search, ordering, status, vehicle_type }),
    placeholderData: (prev) => prev,
  });

  const { data: driversData } = useQuery({
    queryKey: ["drivers-list"],
    queryFn: () => getDrivers(),
    staleTime: 5 * 60 * 1000,
  });

  const driversMap = new Map(
    driversData?.results.map((d) => [d.id, d.license_number]) ?? []
  );

  const sorting: SortingState = ordering
    ? [{ id: ordering.replace("-", ""), desc: ordering.startsWith("-") }]
    : [];

  const { canEdit, canDelete } = useModulePermissions("transport");
  const columns = getTransportColumns(driversMap, canEdit, canDelete);

  const table = useReactTable({
    data: data?.results ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: data ? Math.ceil(data.count / 20) : -1,
    state: {
      pagination: { pageIndex: Number(page) - 1, pageSize: 20 },
      sorting,
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      if (next.length === 0) updateParams({ ordering: "", page: "1" });
      else {
        const { id, desc } = next[0];
        updateParams({ ordering: desc ? `-${id}` : id, page: "1" });
      }
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: Number(page) - 1, pageSize: 20 })
          : updater;
      updateParams({ page: String(next.pageIndex + 1) });
    },
  });

  if (isError) {
    return <p className="text-sm text-destructive">Error al cargar transportes.</p>;
  }

  const currentPage = Number(page);
  const totalPages = data ? Math.ceil(data.count / 20) : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            aria-label="Buscar transportes"
            placeholder="Buscar por placa..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 sm:max-w-sm"
          />
          <Sheet>
            <SheetTrigger className="sm:hidden inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted transition-colors">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros{(status || vehicle_type) ? ` (${[status, vehicle_type].filter(Boolean).length})` : ""}
            </SheetTrigger>
            <SheetContent side="bottom" className="pb-8">
              <SheetHeader className="mb-4">
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Estado</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_FILTERS.map((f) => (
                      <Button key={f.value} variant={status === f.value ? "default" : "outline"} size="sm" onClick={() => updateParams({ status: f.value, page: "1" })}>
                        {f.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tipo de vehículo</p>
                  <div className="flex flex-wrap gap-2">
                    {VEHICLE_FILTERS.map((f) => (
                      <Button key={f.value} variant={vehicle_type === f.value ? "default" : "outline"} size="sm" onClick={() => updateParams({ vehicle_type: f.value, page: "1" })}>
                        {f.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="hidden sm:flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {STATUS_FILTERS.map((f) => (
              <Button key={f.value} variant={status === f.value ? "default" : "outline"} size="sm" onClick={() => updateParams({ status: f.value, page: "1" })}>
                {f.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-1">
            {VEHICLE_FILTERS.map((f) => (
              <Button key={f.value} variant={vehicle_type === f.value ? "default" : "outline"} size="sm" onClick={() => updateParams({ vehicle_type: f.value, page: "1" })}>
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay transportes registrados.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data?.count ?? 0} registros{totalPages > 1 ? ` — Página ${currentPage} de ${totalPages}` : ""}
        </p>
        {totalPages > 1 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateParams({ page: String(currentPage - 1) })}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateParams({ page: String(currentPage + 1) })}
              disabled={currentPage >= totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
