"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { UserTable } from "@/components/users/UserTable";
import { GroupTable } from "@/components/users/GroupTable";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "users", label: "Usuarios" },
  { key: "groups", label: "Roles y Grupos" },
] as const;

function UsersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = (searchParams.get("tab") ?? "users") as "users" | "groups";

  function setTab(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    params.delete("page");
    params.delete("search");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {tab === "users" ? "Usuarios" : "Roles y Grupos"}
        </h1>
        {tab === "users" && (
          <Link href="/users/new" className={buttonVariants()}>
            <Plus className="h-4 w-4" />Nuevo Usuario
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
        {tab === "users" ? <UserTable /> : <GroupTable />}
      </Suspense>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense>
      <UsersPageContent />
    </Suspense>
  );
}
