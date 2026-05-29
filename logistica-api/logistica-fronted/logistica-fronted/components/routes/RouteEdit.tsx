"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getRoute } from "@/lib/api/routes";
import { RouteForm } from "./RouteForm";
import { StopsPanel } from "./StopsPanel";

interface Props {
  id: number;
}

export function RouteEdit({ id }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["route", id],
    queryFn: () => getRoute(id),
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
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">Ruta no encontrada.</p>
        <Link
          href="/routes"
          className="text-sm text-muted-foreground underline"
        >
          ← Volver a rutas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <RouteForm route={data} />
      <hr className="border-border" />
      <StopsPanel routeId={id} stops={data.stops} />
    </div>
  );
}
