import { Suspense } from "react";
import { DriverTable } from "@/components/drivers/DriverTable";
import { CreateButton } from "@/components/ui/create-button";

export default function DriversPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Conductores</h1>
        <CreateButton permission="drivers.add_driver" href="/drivers/new" label="Nuevo Conductor" />
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <DriverTable />
      </Suspense>
    </div>
  );
}
