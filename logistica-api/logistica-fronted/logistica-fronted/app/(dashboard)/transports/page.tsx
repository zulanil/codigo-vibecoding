import { Suspense } from "react";
import { TransportTable } from "@/components/transports/TransportTable";
import { CreateButton } from "@/components/ui/create-button";

export default function TransportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transportes</h1>
        <CreateButton permission="transport.add_transport" href="/transports/new" label="Nuevo Transporte" />
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <TransportTable />
      </Suspense>
    </div>
  );
}
