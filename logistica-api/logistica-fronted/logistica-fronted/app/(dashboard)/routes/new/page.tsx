import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { RouteForm } from "@/components/routes/RouteForm";

export default function NewRoutePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/routes"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold">Nueva Ruta</h1>
      </div>
      <RouteForm />
    </div>
  );
}
