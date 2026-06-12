import { Suspense } from "react";
import { CreateButton } from "@/components/ui/create-button";
import { CustomerTable } from "@/components/customers/CustomerTable";

export default function CustomersPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <CreateButton permission="customers.add_customer" href="/customers/new" label="Nuevo Cliente" />
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <CustomerTable />
      </Suspense>
    </div>
  );
}
