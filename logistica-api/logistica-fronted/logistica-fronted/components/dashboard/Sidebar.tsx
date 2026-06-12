"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Building2, Package, Users, Truck, UserCheck,
  Route, Warehouse, ShoppingBag, LayoutDashboard, UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "__any__" },
  { href: "/suppliers", label: "Proveedores", icon: Building2, permission: "suppliers.view_supplier" },
  { href: "/warehouses", label: "Almacenes", icon: Warehouse, permission: "warehouses.view_warehouse" },
  { href: "/customers", label: "Clientes", icon: Users, permission: "customers.view_customer" },
  { href: "/products", label: "Productos", icon: Package, permission: "products.view_product" },
  { href: "/drivers", label: "Conductores", icon: UserCheck, permission: "drivers.view_driver" },
  { href: "/transports", label: "Transportes", icon: Truck, permission: "transport.view_transport" },
  { href: "/routes", label: "Rutas", icon: Route, permission: "routes.view_route" },
  { href: "/shipments", label: "Envíos", icon: ShoppingBag, permission: "shipments.view_shipment" },
  { href: "/users", label: "Usuarios", icon: UserCog, permission: "__superuser__" },
];

export function Sidebar() {
  const pathname = usePathname();
  const isSuperuser = useAuthStore((s) => s.isSuperuser);
  const permissions = useAuthStore((s) => s.permissions);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const visibleItems = mounted
    ? NAV_ITEMS.filter(({ permission }) => {
        if (!permission) return true;
        if (permission === "__superuser__") return isSuperuser;
        if (permission === "__any__") return isSuperuser || permissions.length > 0;
        if (isSuperuser || permissions.includes("*")) return true;
        return permissions.includes(permission);
      })
    : NAV_ITEMS.filter(({ permission }) => permission !== "__superuser__");

  return (
    <aside className="hidden md:flex h-screen w-60 flex-col border-r bg-sidebar shrink-0">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <span className="font-semibold text-sidebar-foreground">Logística</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {visibleItems.map(({ href, label, icon: Icon }) => {
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
