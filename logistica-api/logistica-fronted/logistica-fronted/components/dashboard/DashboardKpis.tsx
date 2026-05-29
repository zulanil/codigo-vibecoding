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

export default function DashboardKpis() {
  const { data: totalShipments, isLoading: loadingTotal } = useQuery({
    queryKey: ["kpi-total-shipments"],
    queryFn: () => getShipments({ page: "1" }),
  });

  const { data: inTransit, isLoading: loadingInTransit } = useQuery({
    queryKey: ["kpi-in-transit"],
    queryFn: () => getShipments({ status: "in_transit", page: "1" }),
  });

  const { data: availableDrivers, isLoading: loadingDrivers } = useQuery({
    queryKey: ["kpi-available-drivers"],
    queryFn: () => getDrivers({ status: "available", page: "1" }),
  });

  const { data: availableTransports, isLoading: loadingTransports } = useQuery({
    queryKey: ["kpi-available-transports"],
    queryFn: () => getTransports({ status: "available", page: "1" }),
  });

  const { data: activeCustomers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["kpi-active-customers"],
    queryFn: () => getCustomers({ page: "1" }),
  });

  const { data: allShipments, isLoading: loadingRevenue } = useQuery({
    queryKey: ["kpi-revenue"],
    queryFn: () =>
      fetchAllPages<Shipment>((page) => getShipments({ page })),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading =
    loadingTotal ||
    loadingInTransit ||
    loadingDrivers ||
    loadingTransports ||
    loadingCustomers ||
    loadingRevenue;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
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
      <KpiCard
        title="Total envíos"
        value={totalShipments?.count ?? 0}
        icon={<Package className="h-4 w-4" />}
      />
      <KpiCard
        title="En tránsito"
        value={inTransit?.count ?? 0}
        icon={<Truck className="h-4 w-4" />}
      />
      <KpiCard
        title="Ingresos totales"
        value={`$${parseFloat(totalRevenue).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`}
        icon={<DollarSign className="h-4 w-4" />}
      />
      <KpiCard
        title="Conductores disponibles"
        value={availableDrivers?.count ?? 0}
        icon={<UserCheck className="h-4 w-4" />}
      />
      <KpiCard
        title="Vehículos disponibles"
        value={availableTransports?.count ?? 0}
        icon={<Gauge className="h-4 w-4" />}
      />
      <KpiCard
        title="Clientes activos"
        value={activeCustomers?.count ?? 0}
        icon={<Users className="h-4 w-4" />}
      />
    </div>
  );
}
