import { Suspense } from "react";
import { ShipmentTable } from "@/components/shipments/ShipmentTable";
import { CreateButton } from "@/components/ui/create-button";

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; ordering?: string; status?: string }>;
}) {
  await searchParams;
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Envíos</h1>
        <CreateButton permission="shipments.add_shipment" href="/shipments/new" label="Nuevo Envío" />
      </div>
      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        }
      >
        <ShipmentTable />
      </Suspense>
    </div>
  );
}
