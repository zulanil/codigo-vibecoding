import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { TransportTable } from "@/components/transports/TransportTable";

export default function TransportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transportes</h1>
        <Link href="/transports/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />Nuevo Transporte
        </Link>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        <TransportTable />
      </Suspense>
    </div>
  );
}
