import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DriverTable } from "@/components/drivers/DriverTable";

export default function DriversPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Conductores</h1>
        <Link href="/drivers/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />Nuevo Conductor
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <DriverTable />
      </Suspense>
    </div>
  );
}
