"use client";

import { useQuery } from "@tanstack/react-query";
import { getDriver } from "@/lib/api/drivers";
import { DriverForm } from "./DriverForm";

interface Props {
  id: number;
}

export function DriverEdit({ id }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["driver", id],
    queryFn: () => getDriver(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Conductor no encontrado.</p>;
  }

  return <DriverForm driver={data} />;
}
