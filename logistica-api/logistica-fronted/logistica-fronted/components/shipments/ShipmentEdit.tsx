"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getShipment } from "@/lib/api/shipments";
import { ShipmentForm } from "./ShipmentForm";
import { ShipmentItemsPanel } from "./ShipmentItemsPanel";

interface Props {
  id: number;
}

export function ShipmentEdit({ id }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => getShipment(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">Envío no encontrado.</p>
        <Link
          href="/shipments"
          className="text-sm text-muted-foreground underline"
        >
          ← Volver a envíos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ShipmentForm shipment={data} />
      <hr className="border-border" />
      <ShipmentItemsPanel shipmentId={id} items={data.shipment_products} />
    </div>
  );
}
