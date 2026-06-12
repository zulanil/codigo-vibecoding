"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/types";

export function getCustomerColumns(
  onDelete: (customer: Customer) => void,
  canEdit = true,
  canDelete = true,
): ColumnDef<Customer>[] {
  return [
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
      accessorKey: "company_name",
      header: "Empresa",
      cell: ({ row }) => row.original.company_name || "—",
    },
    {
      accessorKey: "customer_type",
      header: "Tipo",
      cell: ({ row }) =>
        row.original.customer_type === "company" ? (
          <Badge variant="default">Empresa</Badge>
        ) : (
          <Badge variant="secondary">Individual</Badge>
        ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {canEdit && (
            <Link
              href={`/customers/${row.original.id}`}
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
