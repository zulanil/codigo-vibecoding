import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { WarehouseTable } from "@/components/warehouses/WarehouseTable";

export default function WarehousesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Almacenes</h1>
        <Link href="/warehouses/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />Nuevo Almacén
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <WarehouseTable />
      </Suspense>
    </div>
  );
}
