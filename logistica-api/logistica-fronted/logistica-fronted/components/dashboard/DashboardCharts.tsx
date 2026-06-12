'use client';

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllPages } from "@/lib/api/dashboard";
import { getShipments } from "@/lib/api/shipments";
import { getCustomers } from "@/lib/api/customers";
import { getTransports } from "@/lib/api/transports";
import type { Shipment, Customer, Transport } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ShipmentStatusChart from "@/components/dashboard/charts/ShipmentStatusChart";
import ShipmentsOverTimeChart from "@/components/dashboard/charts/ShipmentsOverTimeChart";
import RevenueOverTimeChart from "@/components/dashboard/charts/RevenueOverTimeChart";
import TopCustomersChart from "@/components/dashboard/charts/TopCustomersChart";
import TransportFleetChart from "@/components/dashboard/charts/TransportFleetChart";
import { usePermission } from "@/lib/hooks/usePermission";

export default function DashboardCharts() {
  const canViewShipments = usePermission("shipments.view_shipment");
  const canViewCustomers = usePermission("customers.view_customer");
  const canViewTransports = usePermission("transport.view_transport");

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data: shipments, isLoading: loadingShipments } = useQuery({
    queryKey: ["dashboard-shipments-all"],
    queryFn: () => fetchAllPages<Shipment>((page) => getShipments({ page })),
    staleTime: 5 * 60 * 1000,
    enabled: canViewShipments,
  });

  const { data: customers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["dashboard-customers-all"],
    queryFn: () => fetchAllPages<Customer>((page) => getCustomers({ page })),
    staleTime: 5 * 60 * 1000,
    enabled: canViewCustomers,
  });

  const { data: transports, isLoading: loadingTransports } = useQuery({
    queryKey: ["dashboard-transports-all"],
    queryFn: () => fetchAllPages<Transport>((page) => getTransports({ page })),
    staleTime: 5 * 60 * 1000,
    enabled: canViewTransports,
  });

  const hasAnyChart = canViewShipments || canViewCustomers || canViewTransports;
  if (!hasAnyChart) return null;

  const isLoading =
    (canViewShipments && loadingShipments) ||
    (canViewCustomers && loadingCustomers) ||
    (canViewTransports && loadingTransports);

  if (isLoading) {
    const chartCount = [canViewShipments, canViewShipments, canViewShipments, canViewCustomers, canViewTransports].filter(Boolean).length;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: chartCount }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const allDates = (shipments ?? []).map((s) => s.created_at.substring(0, 10)).sort();
  const dataMinDate = allDates[0] ?? "";
  const dataMaxDate = allDates[allDates.length - 1] ?? "";

  const filteredShipments: Shipment[] = (shipments ?? []).filter((s) => {
    const date = s.created_at.substring(0, 10);
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {canViewShipments && (
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="date-from" className="text-sm text-muted-foreground">Desde</label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              min={dataMinDate}
              max={dateTo || dataMaxDate}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="date-to" className="text-sm text-muted-foreground">Hasta</label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              min={dateFrom || dataMinDate}
              max={dataMaxDate}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent cursor-pointer transition-colors duration-150"
          >
            Limpiar
          </button>
          {dataMinDate && (
            <span className="text-xs text-muted-foreground">
              Datos: {dataMinDate} — {dataMaxDate}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {canViewShipments && (
          <Card>
            <CardHeader><CardTitle>Estado de envíos</CardTitle></CardHeader>
            <CardContent><ShipmentStatusChart data={filteredShipments} /></CardContent>
          </Card>
        )}
        {canViewShipments && (
          <Card>
            <CardHeader><CardTitle>Envíos por mes</CardTitle></CardHeader>
            <CardContent><ShipmentsOverTimeChart data={filteredShipments} /></CardContent>
          </Card>
        )}
        {canViewShipments && (
          <Card>
            <CardHeader><CardTitle>Ingresos por mes</CardTitle></CardHeader>
            <CardContent><RevenueOverTimeChart data={filteredShipments} /></CardContent>
          </Card>
        )}
        {canViewCustomers && (
          <Card>
            <CardHeader><CardTitle>Top 10 clientes</CardTitle></CardHeader>
            <CardContent>
              <TopCustomersChart shipments={filteredShipments} customers={customers ?? []} />
            </CardContent>
          </Card>
        )}
        {canViewTransports && (
          <Card>
            <CardHeader><CardTitle>Flota por tipo de transporte</CardTitle></CardHeader>
            <CardContent><TransportFleetChart data={transports ?? []} /></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
