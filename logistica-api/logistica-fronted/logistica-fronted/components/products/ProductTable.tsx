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
import { getProducts } from "@/lib/api/products";
import { getSuppliers } from "@/lib/api/suppliers";
import { getProductColumns } from "./ProductColumns";
import { DeleteProductDialog } from "./DeleteProductDialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useModulePermissions } from "@/lib/hooks/usePermission";

export function ProductTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = searchParams.get("page") ?? "1";
  const search = searchParams.get("search") ?? "";
  const ordering = searchParams.get("ordering") ?? "";
  const supplier = searchParams.get("supplier") ?? "";

  const [searchInput, setSearchInput] = useState(search);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

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
    queryKey: ["products", { page, search, ordering, supplier }],
    queryFn: () => getProducts({ page, search, ordering, supplier }),
    placeholderData: (prev) => prev,
  });

  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: () => getSuppliers(),
    staleTime: 5 * 60 * 1000,
  });

  const suppliersMap = new Map<number, string>(
    suppliersData?.results.map((s) => [s.id, s.name]) ?? []
  );

  const sorting: SortingState = ordering
    ? [{ id: ordering.replace("-", ""), desc: ordering.startsWith("-") }]
    : [];

  const { canEdit, canDelete } = useModulePermissions("products");
  const columns = getProductColumns(suppliersMap, setProductToDelete, canEdit, canDelete);

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
    return <p className="text-sm text-destructive">Error al cargar productos.</p>;
  }

  const currentPage = Number(page);
  const totalPages = data ? Math.ceil(data.count / 20) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          aria-label="Buscar productos"
          placeholder="Buscar por nombre, SKU o descripción..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={supplier || "all"}
          onValueChange={(v) =>
            updateParams({ supplier: v === "all" ? "" : (v ?? ""), page: "1" })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos los proveedores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proveedores</SelectItem>
            {suppliersData?.results.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  No hay productos registrados.
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

      <DeleteProductDialog
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
      />
    </div>
  );
}
