"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Pencil, ArrowUpDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeleteTransportDialog } from "./DeleteTransportDialog";
import type { Transport } from "@/lib/types";

const VEHICLE_LABELS: Record<string, string> = {
  truck: "Camión",
  van: "Furgoneta",
  motorcycle: "Moto",
};

export function getTransportColumns(
  driversMap: Map<number, string>,
  canEdit = true,
  canDelete = true
): ColumnDef<Transport>[] {
  return [
    {
      accessorKey: "plate_number",
      enableSorting: true,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Placa
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "vehicle_type",
      header: "Tipo de Vehículo",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {VEHICLE_LABELS[row.original.vehicle_type] ?? row.original.vehicle_type}
        </Badge>
      ),
    },
    {
      accessorKey: "capacity_kg",
      header: "Capacidad (kg)",
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
        if (status === "available") {
          return (
            <Badge variant="outline" className="text-green-600 border-green-600">
              Disponible
            </Badge>
          );
        }
        if (status === "in_use") {
          return (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              En uso
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            Mantenimiento
          </Badge>
        );
      },
    },
    {
      accessorKey: "driver",
      header: "Conductor",
      cell: ({ row }) => {
        const driverId = row.original.driver;
        if (driverId === null) return <span className="text-muted-foreground">Sin asignar</span>;
        return driversMap.get(driverId) ?? `#${driverId}`;
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {canEdit && (
            <Link
              href={`/transports/${row.original.id}`}
              aria-label={`Editar ${row.original.plate_number}`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <Pencil className="h-4 w-4" />
            </Link>
          )}
          {canDelete && (
            <DeleteTransportDialog
              id={row.original.id}
              plate_number={row.original.plate_number}
            />
          )}
        </div>
      ),
    },
  ];
}
