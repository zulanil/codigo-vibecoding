import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SupplierTable } from "@/components/suppliers/SupplierTable";

export default function SuppliersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Proveedores</h1>
        <Link href="/suppliers/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />Nuevo Proveedor
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <SupplierTable />
      </Suspense>
    </div>
  );
}
