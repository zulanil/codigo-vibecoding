import { Suspense } from "react";
import { CreateButton } from "@/components/ui/create-button";
import { SupplierTable } from "@/components/suppliers/SupplierTable";

export default function SuppliersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Proveedores</h1>
        <CreateButton permission="suppliers.add_supplier" href="/suppliers/new" label="Nuevo Proveedor" />
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <SupplierTable />
      </Suspense>
    </div>
  );
}
