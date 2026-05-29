"use client";

import { useQuery } from "@tanstack/react-query";
import { getTransport } from "@/lib/api/transports";
import { TransportForm } from "./TransportForm";

interface Props {
  id: number;
}

export function TransportEdit({ id }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["transport", id],
    queryFn: () => getTransport(id),
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
        <p className="text-sm text-destructive">Transporte no encontrado.</p>
        <a href="/transports" className="text-sm text-muted-foreground underline">
          Volver a transportes
        </a>
      </div>
    );
  }

  return <TransportForm transport={data} />;
}
