"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { ProductThumbnail } from "./ProductThumbnail";

export function getProductColumns(
  suppliersMap: Map<number, string>,
  onDelete: (product: Product) => void,
  canEdit = true,
  canDelete = true,
): ColumnDef<Product>[] {
  return [
    {
      id: "image",
      header: "",
      cell: ({ row }) => (
        <ProductThumbnail imageUrl={row.original.image_url} name={row.original.name} />
      ),
      size: 48,
    },
    {
      accessorKey: "sku",
      enableSorting: true,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          SKU
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "name",
      enableSorting: true,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "supplier",
      header: "Proveedor",
      cell: ({ row }) =>
        suppliersMap.get(row.original.supplier) ?? `#${row.original.supplier}`,
    },
    {
      accessorKey: "weight_kg",
      header: "Peso (kg)",
    },
    {
      accessorKey: "unit_price",
      enableSorting: true,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Precio
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {canEdit && (
            <Link
              href={`/products/${row.original.id}`}
              aria-label={`Editar ${row.original.name}`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <Pencil className="h-4 w-4" />
            </Link>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Eliminar ${row.original.name}`}
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];
}
