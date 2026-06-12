import { Suspense } from "react";
import { RouteTable } from "@/components/routes/RouteTable";
import { CreateButton } from "@/components/ui/create-button";

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  await searchParams;
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rutas</h1>
        <CreateButton permission="routes.add_route" href="/routes/new" label="Nueva Ruta" />
      </div>
      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
            ))}
          </div>
        }
      >
        <RouteTable />
      </Suspense>
    </div>
  );
}
