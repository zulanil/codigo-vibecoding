"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AddStopDialog } from "./AddStopDialog";
import type { RouteStop } from "@/lib/types";

interface Props {
  routeId: number;
  stops: RouteStop[];
}

const columns: ColumnDef<RouteStop>[] = [
  {
    accessorKey: "stop_order",
    header: "Orden",
  },
  {
    accessorKey: "address",
    header: "Dirección",
  },
  {
    accessorKey: "city",
    header: "Ciudad",
  },
  {
    accessorKey: "estimated_arrival",
    header: "Llegada estimada",
    cell: ({ row }) => row.original.estimated_arrival ?? "—",
  },
  {
    accessorKey: "actual_arrival",
    header: "Llegada real",
    cell: ({ row }) => row.original.actual_arrival ?? "—",
  },
];

export function StopsPanel({ routeId, stops }: Props) {
  const [open, setOpen] = useState(false);

  const table = useReactTable({
    data: stops,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Paradas{" "}
          <span className="text-muted-foreground font-normal text-sm">
            ({stops.length} {stops.length === 1 ? "parada" : "paradas"})
          </span>
        </h2>
        <Button size="sm" onClick={() => setOpen(true)}>
          + Agregar parada
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
                  Sin paradas registradas.
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

      <AddStopDialog
        routeId={routeId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
