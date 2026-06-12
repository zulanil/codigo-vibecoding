'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Shipment, ShipmentStatus } from "@/lib/types";

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  pending: "#64748b",
  assigned: "#2563eb",
  in_transit: "#d97706",
  delivered: "#16a34a",
  cancelled: "#dc2626",
};

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  in_transit: "En tránsito",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const ALL_STATUSES: ShipmentStatus[] = [
  "pending",
  "assigned",
  "in_transit",
  "delivered",
  "cancelled",
];

interface ShipmentStatusChartProps {
  data: Shipment[];
}

export default function ShipmentStatusChart({ data }: ShipmentStatusChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-16">Sin datos</p>
    );
  }

  const counts: Record<ShipmentStatus, number> = {
    pending: 0,
    assigned: 0,
    in_transit: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const shipment of data) {
    counts[shipment.status] = (counts[shipment.status] ?? 0) + 1;
  }

  const chartData = ALL_STATUSES
    .map((status) => ({ name: status, label: STATUS_LABELS[status], value: counts[status] }))
    .filter((entry) => entry.value > 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="label"
          innerRadius={65}
          outerRadius={105}
          paddingAngle={3}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--card-foreground)' }}
          labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
          itemStyle={{ color: 'var(--muted-foreground)' }}
          formatter={(value, name) => [Number(value ?? 0), String(name ?? '')]}
        />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
