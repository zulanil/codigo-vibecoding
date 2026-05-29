import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { WarehouseForm } from "@/components/warehouses/WarehouseForm";

export default function NewWarehousePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/warehouses"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold">Nuevo Almacén</h1>
      </div>
      <WarehouseForm />
    </div>
  );
}
