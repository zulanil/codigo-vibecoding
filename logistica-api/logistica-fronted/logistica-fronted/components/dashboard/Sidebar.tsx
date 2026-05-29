"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Package,
  Users,
  Truck,
  UserCheck,
  Route,
  Warehouse,
  ShoppingBag,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/suppliers", label: "Proveedores", icon: Building2 },
  { href: "/warehouses", label: "Almacenes", icon: Warehouse },
  { href: "/customers", label: "Clientes", icon: Users },
  { href: "/products", label: "Productos", icon: Package },
  { href: "/drivers", label: "Conductores", icon: UserCheck },
  { href: "/transports", label: "Transportes", icon: Truck },
  { href: "/routes", label: "Rutas", icon: Route },
  { href: "/shipments", label: "Envíos", icon: ShoppingBag },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex h-screen w-60 flex-col border-r bg-sidebar shrink-0">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <span className="font-semibold text-sidebar-foreground">Logística</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
