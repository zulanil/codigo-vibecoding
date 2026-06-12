import { useAuthStore } from "@/lib/stores/auth";

export function usePermission(permission: string): boolean {
  const isSuperuser = useAuthStore((s) => s.isSuperuser);
  const permissions = useAuthStore((s) => s.permissions);
  if (isSuperuser) return true;
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
}

export function useModulePermissions(module: string) {
  return {
    canView: usePermission(`${module}.view_${getModel(module)}`),
    canCreate: usePermission(`${module}.add_${getModel(module)}`),
    canEdit: usePermission(`${module}.change_${getModel(module)}`),
    canDelete: usePermission(`${module}.delete_${getModel(module)}`),
  };
}

const MODEL_MAP: Record<string, string> = {
  customers: "customer",
  suppliers: "supplier",
  warehouses: "warehouse",
  products: "product",
  drivers: "driver",
  transport: "transport",
  routes: "route",
  shipments: "shipment",
};

function getModel(module: string): string {
  return MODEL_MAP[module] ?? module;
}
