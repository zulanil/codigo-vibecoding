"use client";

import { useQuery } from "@tanstack/react-query";
import { getWarehouse } from "@/lib/api/warehouses";
import { WarehouseForm } from "./WarehouseForm";

interface Props {
  id: number;
}

export function WarehouseEdit({ id }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["warehouse", id],
    queryFn: () => getWarehouse(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Almacén no encontrado.</p>;
  }

  return <WarehouseForm warehouse={data} />;
}
