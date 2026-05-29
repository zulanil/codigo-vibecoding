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

export default function DashboardCharts() {
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const {
    data: shipments,
    isLoading: loadingShipments,
    isError: errorShipments,
  } = useQuery({
    queryKey: ["dashboard-shipments-all"],
    queryFn: () =>
      fetchAllPages<Shipment>((page) => getShipments({ page })),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: customers,
    isLoading: loadingCustomers,
    isError: errorCustomers,
  } = useQuery({
    queryKey: ["dashboard-customers-all"],
    queryFn: () =>
      fetchAllPages<Customer>((page) => getCustomers({ page })),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: transports,
    isLoading: loadingTransports,
  } = useQuery({
    queryKey: ["dashboard-transports-all"],
    queryFn: () =>
      fetchAllPages<Transport>((page) => getTransports({ page })),
    staleTime: 5 * 60 * 1000,
  });

  const filteredShipments: Shipment[] = (shipments ?? []).filter((shipment) => {
    const date = shipment.created_at.substring(0, 10);
    if (dateFrom !== "" && date < dateFrom) return false;
    if (dateTo !== "" && date > dateTo) return false;
    return true;
  });

  if (loadingShipments || loadingCustomers || loadingTransports) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
          <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (errorShipments || errorCustomers) {
    return (
      <p className="text-destructive">
        Error al cargar los datos del dashboard
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="date-from" className="text-sm text-muted-foreground">
            Desde
          </label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="date-to" className="text-sm text-muted-foreground">
            Hasta
          </label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={() => {
            setDateFrom("");
            setDateTo("");
          }}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent cursor-pointer transition-colors duration-150"
        >
          Limpiar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado de envíos</CardTitle>
          </CardHeader>
          <CardContent>
            <ShipmentStatusChart data={filteredShipments} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Envíos por mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ShipmentsOverTimeChart data={filteredShipments} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingresos por mes</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueOverTimeChart data={filteredShipments} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <TopCustomersChart
              shipments={filteredShipments}
              customers={customers ?? []}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flota por tipo de transporte</CardTitle>
          </CardHeader>
          <CardContent>
            <TransportFleetChart data={transports ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
