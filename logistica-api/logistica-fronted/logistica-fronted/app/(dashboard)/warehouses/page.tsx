import { Suspense } from "react";
import { CreateButton } from "@/components/ui/create-button";
import { WarehouseTable } from "@/components/warehouses/WarehouseTable";

export default function WarehousesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Almacenes</h1>
        <CreateButton permission="warehouses.add_warehouse" href="/warehouses/new" label="Nuevo Almacén" />
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <WarehouseTable />
      </Suspense>
    </div>
  );
}
