"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeleteShipmentDialog } from "./DeleteShipmentDialog";
import type { Shipment } from "@/lib/types";

const formatCOP = (value: string) =>
  `$${parseFloat(value).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  in_transit: "En tránsito",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export function getShipmentColumns(
  customersMap: Map<number, string>,
  canEdit = true,
  canDelete = true
): ColumnDef<Shipment>[] {
  return [
    {
      accessorKey: "tracking_number",
      header: "Tracking",
    },
    {
      accessorKey: "customer",
      header: "Cliente",
      cell: ({ row }) => {
        const customerId = row.original.customer;
        return customersMap.get(customerId) ?? String(customerId);
      },
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
        if (status === "pending") {
          return (
            <Badge variant="outline" className="text-gray-600 border-gray-400">
              {STATUS_LABELS[status]}
            </Badge>
          );
        }
        if (status === "assigned") {
          return (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              {STATUS_LABELS[status]}
            </Badge>
          );
        }
        if (status === "in_transit") {
          return (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              {STATUS_LABELS[status]}
            </Badge>
          );
        }
        if (status === "delivered") {
          return (
            <Badge variant="outline" className="text-green-600 border-green-600">
              {STATUS_LABELS[status]}
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            {STATUS_LABELS[status] ?? status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "destination_address",
      header: "Destino",
    },
    {
      accessorKey: "scheduled_delivery_date",
      enableSorting: true,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Entrega programada
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.original.scheduled_delivery_date;
        return date ?? "—";
      },
    },
    {
      accessorKey: "shipping_cost",
      header: "Costo",
      cell: ({ row }) => formatCOP(row.original.shipping_cost),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {canEdit && (
            <Link
              href={`/shipments/${row.original.id}`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Editar
            </Link>
          )}
          {canDelete && <DeleteShipmentDialog id={row.original.id} />}
        </div>
      ),
    },
  ];
}
