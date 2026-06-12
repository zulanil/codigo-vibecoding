import { Suspense } from "react";
import { CreateButton } from "@/components/ui/create-button";
import { ProductTable } from "@/components/products/ProductTable";

export default function ProductsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <CreateButton permission="products.add_product" href="/products/new" label="Nuevo Producto" />
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <ProductTable />
      </Suspense>
    </div>
  );
}
