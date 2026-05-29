"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Driver } from "@/lib/types";

export function getDriverColumns(
  onDelete: (driver: Driver) => void
): ColumnDef<Driver>[] {
  return [
    {
      accessorKey: "license_number",
      header: "Licencia",
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === "available") {
          return (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Disponible
            </Badge>
          );
        }
        if (status === "on_route") {
          return (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              En ruta
            </Badge>
          );
        }
        return <Badge variant="secondary">No disponible</Badge>;
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Link
            href={`/drivers/${row.original.id}`}
            aria-label={`Editar conductor ${row.original.license_number}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Eliminar conductor ${row.original.license_number}`}
            onClick={() => onDelete(row.original)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
}
