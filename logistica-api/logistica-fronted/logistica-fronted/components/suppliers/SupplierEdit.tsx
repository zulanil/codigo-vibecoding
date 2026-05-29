"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupplier } from "@/lib/api/suppliers";
import { SupplierForm } from "./SupplierForm";

interface Props {
  id: number;
}

export function SupplierEdit({ id }: Props) {
  const { data: supplier, isLoading, isError } = useQuery({
    queryKey: ["supplier", id],
    queryFn: () => getSupplier(id),
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

  if (isError || !supplier) {
    return (
      <p className="text-sm text-destructive">Proveedor no encontrado.</p>
    );
  }

  return <SupplierForm supplier={supplier} />;
}
