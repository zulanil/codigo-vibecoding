"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Pencil, ArrowUpDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeleteRouteDialog } from "./DeleteRouteDialog";
import type { Route } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  planned: "Planificada",
  in_progress: "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
};

export function getRouteColumns(
  transportsMap: Map<number, string>,
  warehousesMap: Map<number, string>
): ColumnDef<Route>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
    },
    {
      accessorKey: "status",
      enableSorting: true,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Estado
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        if (status === "planned") {
          return (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              {STATUS_LABELS[status]}
            </Badge>
          );
        }
        if (status === "in_progress") {
          return (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              {STATUS_LABELS[status]}
            </Badge>
          );
        }
        if (status === "completed") {
          return (
            <Badge variant="outline" className="text-green-600 border-green-600">
              {STATUS_LABELS[status]}
            </Badge>
          );
        }
        return (
          <Badge variant="secondary" className="text-red-600">
            {STATUS_LABELS[status] ?? status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "scheduled_date",
      enableSorting: true,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Fecha programada
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "transport",
      header: "Transporte",
      cell: ({ row }) => {
        const transportId = row.original.transport;
        return (
          transportsMap.get(transportId) ?? String(transportId)
        );
      },
    },
    {
      accessorKey: "origin_warehouse",
      header: "Almacén origen",
      cell: ({ row }) => {
        const warehouseId = row.original.origin_warehouse;
        return (
          warehousesMap.get(warehouseId) ?? String(warehouseId)
        );
      },
    },
    {
      accessorKey: "stops",
      header: "Paradas",
      cell: ({ row }) => row.original.stops.length,
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Link
            href={`/routes/${row.original.id}`}
            aria-label={`Editar ${row.original.name}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <DeleteRouteDialog id={row.original.id} />
        </div>
      ),
    },
  ];
}
