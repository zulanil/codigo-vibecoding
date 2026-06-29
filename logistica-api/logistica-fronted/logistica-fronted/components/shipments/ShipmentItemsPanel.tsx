"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/api/products";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AddItemDialog } from "./AddItemDialog";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import type { ShipmentProduct, Product } from "@/lib/types";

interface Props {
  shipmentId: number;
  items: ShipmentProduct[];
}

export function ShipmentItemsPanel({ shipmentId, items }: Props) {
  const [open, setOpen] = useState(false);

  const { data: productsData } = useQuery({
    queryKey: ["products-list"],
    queryFn: () => getProducts(),
    staleTime: 5 * 60 * 1000,
  });

  const productsMap = new Map<number, Pick<Product, "name" | "image_url">>(
    productsData?.results.map((p) => [p.id, { name: p.name, image_url: p.image_url }]) ?? []
  );

  const columns: ColumnDef<ShipmentProduct>[] = [
    {
      accessorKey: "product",
      header: "Producto",
      cell: ({ row }) => {
        const productId = row.original.product;
        const product = productsMap.get(productId);
        const name = product?.name ?? String(productId);
        return (
          <div className="flex items-center gap-2">
            <ProductThumbnail imageUrl={product?.image_url ?? null} name={name} />
            <span>{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: "Cantidad",
    },
    {
      accessorKey: "unit_price",
      header: "Precio unitario",
    },
    {
      id: "total",
      header: "Total",
      cell: ({ row }) => {
        const parsed = parseFloat(row.original.unit_price);
        if (isNaN(parsed)) return "—";
        return (row.original.quantity * parsed).toFixed(2);
      },
    },
  ];

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Productos del envío{" "}
          <span className="text-muted-foreground font-normal text-sm">
            ({items.length} {items.length === 1 ? "producto" : "productos"})
          </span>
        </h2>
        <Button size="sm" onClick={() => setOpen(true)}>
          + Agregar producto
        </Button>
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
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-16 text-center text-muted-foreground"
                >
                  Sin productos registrados.
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

      <AddItemDialog
        shipmentId={shipmentId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
