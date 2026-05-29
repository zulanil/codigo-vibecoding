import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ProductTable } from "@/components/products/ProductTable";

export default function ProductsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <Link href="/products/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />Nuevo Producto
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <ProductTable />
      </Suspense>
    </div>
  );
}
