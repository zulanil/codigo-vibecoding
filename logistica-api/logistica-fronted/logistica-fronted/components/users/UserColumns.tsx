"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Pencil, UserX, ArrowUpDown } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/types";

export function getUserColumns(
  onDeactivate: (user: AuthUser) => void
): ColumnDef<AuthUser>[] {
  return [
    {
      accessorKey: "username",
      enableSorting: true,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-3"
        >
          Usuario
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      id: "full_name",
      header: "Nombre",
      cell: ({ row }) => {
        const { first_name, last_name } = row.original;
        const name = [first_name, last_name].filter(Boolean).join(" ");
        return name || "—";
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.original.email || "—",
    },
    {
      id: "groups",
      header: "Roles",
      cell: ({ row }) => {
        const { groups, is_superuser } = row.original;
        if (is_superuser) return <Badge variant="default">Superadmin</Badge>;
        if (groups.length === 0) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {groups.map((g) => (
              <Badge key={g.id} variant="secondary">{g.name}</Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) =>
        row.original.is_active ? (
          <Badge variant="outline" className="text-green-700 border-green-300">Activo</Badge>
        ) : (
          <Badge variant="outline" className="text-destructive border-destructive/30">Inactivo</Badge>
        ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Link
            href={`/users/${row.original.id}`}
            aria-label={`Editar ${row.original.username}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <Pencil className="h-4 w-4" />
          </Link>
          {row.original.is_active && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Desactivar ${row.original.username}`}
              onClick={() => onDeactivate(row.original)}
            >
              <UserX className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];
}
