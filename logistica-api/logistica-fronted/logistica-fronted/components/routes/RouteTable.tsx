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
import { getRoutes } from "@/lib/api/routes";
import { getTransports } from "@/lib/api/transports";
import { getWarehouses } from "@/lib/api/warehouses";
import { getRouteColumns } from "./RouteColumns";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

const STATUS_FILTERS = [
  { label: "Todos", value: "" },
  { label: "Planificada", value: "planned" },
  { label: "En progreso", value: "in_progress" },
  { label: "Completada", value: "completed" },
  { label: "Cancelada", value: "cancelled" },
];

export function RouteTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = searchParams.get("page") ?? "1";
  const search = searchParams.get("search") ?? "";
  const ordering = searchParams.get("ordering") ?? "";
  const status = searchParams.get("status") ?? "";

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
    queryKey: ["routes", { page, search, ordering, status }],
    queryFn: () => getRoutes({ page, search, ordering, status }),
    placeholderData: (prev) => prev,
  });

  const { data: transportsData } = useQuery({
    queryKey: ["transports-list"],
    queryFn: () => getTransports(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses-list"],
    queryFn: () => getWarehouses(),
    staleTime: 5 * 60 * 1000,
  });

  const transportsMap = new Map(
    transportsData?.results.map((t) => [t.id, t.plate_number]) ?? []
  );

  const warehousesMap = new Map(
    warehousesData?.results.map((w) => [w.id, w.name]) ?? []
  );

  const sorting: SortingState = ordering
    ? [{ id: ordering.replace(/^-/, ""), desc: ordering.startsWith("-") }]
    : [];

  const { canEdit, canDelete } = useModulePermissions("routes");
  const columns = getRouteColumns(transportsMap, warehousesMap, canEdit, canDelete);

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
    return <p className="text-sm text-destructive">Error al cargar rutas.</p>;
  }

  const currentPage = Number(page);
  const totalPages = data ? Math.ceil(data.count / 20) : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            aria-label="Buscar rutas"
            placeholder="Buscar por nombre..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 sm:max-w-sm"
          />
          <Sheet>
            <SheetTrigger className="sm:hidden inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-medium hover:bg-muted transition-colors">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros{status ? " (1)" : ""}
            </SheetTrigger>
            <SheetContent side="bottom" className="pb-8">
              <SheetHeader className="mb-4">
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <div className="space-y-3">
                <p className="text-sm font-medium">Estado</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((f) => (
                    <Button key={f.value} variant={status === f.value ? "default" : "outline"} size="sm" onClick={() => updateParams({ status: f.value, page: "1" })}>
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="hidden sm:flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={status === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => updateParams({ status: f.value, page: "1" })}
            >
              {f.label}
            </Button>
          ))}
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
                  No hay rutas registradas.
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
              disabled={!data?.next}
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
