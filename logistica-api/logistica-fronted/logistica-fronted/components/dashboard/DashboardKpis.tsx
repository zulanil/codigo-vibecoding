'use client';

import { useQuery } from "@tanstack/react-query";
import { getShipments } from "@/lib/api/shipments";
import { getDrivers } from "@/lib/api/drivers";
import { getTransports } from "@/lib/api/transports";
import { getCustomers } from "@/lib/api/customers";
import { fetchAllPages } from "@/lib/api/dashboard";
import type { Shipment } from "@/lib/types";
import KpiCard from "@/components/dashboard/KpiCard";
import { Package, Truck, DollarSign, UserCheck, Gauge, Users } from "lucide-react";
import { usePermission } from "@/lib/hooks/usePermission";

export default function DashboardKpis() {
  const canViewShipments = usePermission("shipments.view_shipment");
  const canViewDrivers = usePermission("drivers.view_driver");
  const canViewTransports = usePermission("transport.view_transport");
  const canViewCustomers = usePermission("customers.view_customer");

  const { data: totalShipments, isLoading: l1 } = useQuery({
    queryKey: ["kpi-total-shipments"],
    queryFn: () => getShipments({ page: "1" }),
    enabled: canViewShipments,
  });

  const { data: inTransit, isLoading: l2 } = useQuery({
    queryKey: ["kpi-in-transit"],
    queryFn: () => getShipments({ status: "in_transit", page: "1" }),
    enabled: canViewShipments,
  });

  const { data: allShipments, isLoading: l3 } = useQuery({
    queryKey: ["kpi-revenue"],
    queryFn: () => fetchAllPages<Shipment>((page) => getShipments({ page })),
    staleTime: 5 * 60 * 1000,
    enabled: canViewShipments,
  });

  const { data: availableDrivers, isLoading: l4 } = useQuery({
    queryKey: ["kpi-available-drivers"],
    queryFn: () => getDrivers({ status: "available", page: "1" }),
    enabled: canViewDrivers,
  });

  const { data: availableTransports, isLoading: l5 } = useQuery({
    queryKey: ["kpi-available-transports"],
    queryFn: () => getTransports({ status: "available", page: "1" }),
    enabled: canViewTransports,
  });

  const { data: activeCustomers, isLoading: l6 } = useQuery({
    queryKey: ["kpi-active-customers"],
    queryFn: () => getCustomers({ page: "1" }),
    enabled: canViewCustomers,
  });

  const visibleCount = [canViewShipments, canViewShipments, canViewShipments, canViewDrivers, canViewTransports, canViewCustomers].filter(Boolean).length;

  if (visibleCount === 0) return null;

  const isLoading = (canViewShipments && (l1 || l2 || l3)) || (canViewDrivers && l4) || (canViewTransports && l5) || (canViewCustomers && l6);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: visibleCount }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const totalRevenue = (allShipments ?? [])
    .reduce((sum, s) => sum + parseFloat(s.shipping_cost), 0)
    .toFixed(2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {canViewShipments && (
        <KpiCard title="Total envíos" value={totalShipments?.count ?? 0} icon={<Package className="h-4 w-4" />} />
      )}
      {canViewShipments && (
        <KpiCard title="En tránsito" value={inTransit?.count ?? 0} icon={<Truck className="h-4 w-4" />} />
      )}
      {canViewShipments && (
        <KpiCard
          title="Ingresos totales"
          value={`$${parseFloat(totalRevenue).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`}
          icon={<DollarSign className="h-4 w-4" />}
        />
      )}
      {canViewDrivers && (
        <KpiCard title="Conductores disponibles" value={availableDrivers?.count ?? 0} icon={<UserCheck className="h-4 w-4" />} />
      )}
      {canViewTransports && (
        <KpiCard title="Vehículos disponibles" value={availableTransports?.count ?? 0} icon={<Gauge className="h-4 w-4" />} />
      )}
      {canViewCustomers && (
        <KpiCard title="Clientes activos" value={activeCustomers?.count ?? 0} icon={<Users className="h-4 w-4" />} />
      )}
    </div>
  );
}
