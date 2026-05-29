import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { CustomerTable } from "@/components/customers/CustomerTable";

export default function CustomersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Link href="/customers/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />Nuevo Cliente
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <CustomerTable />
      </Suspense>
    </div>
  );
}
