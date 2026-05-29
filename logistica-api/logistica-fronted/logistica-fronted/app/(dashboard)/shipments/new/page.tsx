import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ShipmentForm } from "@/components/shipments/ShipmentForm";

export default function NewShipmentPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/shipments"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold">Nuevo Envío</h1>
      </div>
      <ShipmentForm />
    </div>
  );
}
