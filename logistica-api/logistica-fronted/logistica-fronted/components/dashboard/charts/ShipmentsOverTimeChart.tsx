'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Shipment } from "@/lib/types";

interface ShipmentsOverTimeChartProps {
  data: Shipment[];
}

const formatMonth = (m: string) => {
  const [year, month] = m.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('es', {
    month: 'short',
    year: '2-digit',
  });
};

export default function ShipmentsOverTimeChart({
  data,
}: ShipmentsOverTimeChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-16">Sin datos</p>
    );
  }

  const countByMonth: Record<string, number> = {};
  for (const shipment of data) {
    const month = shipment.created_at.substring(0, 7);
    countByMonth[month] = (countByMonth[month] ?? 0) + 1;
  }

  const chartData = Object.entries(countByMonth)
    .map(([month, count]) => ({ month, count, label: formatMonth(month) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="shipmentsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.8} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
        <Tooltip
          contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--card-foreground)' }}
          labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
          itemStyle={{ color: 'var(--muted-foreground)' }}
          formatter={(value) => [Number(value ?? 0), 'Envíos']}
          labelFormatter={(label) => `Mes: ${label}`}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#shipmentsFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
