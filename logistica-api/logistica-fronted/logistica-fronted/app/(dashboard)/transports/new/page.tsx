import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { TransportForm } from "@/components/transports/TransportForm";

export default function NewTransportPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/transports"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold">Nuevo Transporte</h1>
      </div>
      <TransportForm />
    </div>
  );
}
