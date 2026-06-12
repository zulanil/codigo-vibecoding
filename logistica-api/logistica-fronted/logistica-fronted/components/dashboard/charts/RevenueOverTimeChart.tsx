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

interface RevenueOverTimeChartProps {
  data: Shipment[];
}

const formatMonth = (m: string) => {
  const [year, month] = m.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('es', {
    month: 'short',
    year: '2-digit',
  });
};

const formatCurrency = (v: number) =>
  `$${v.toLocaleString('es', { maximumFractionDigits: 0 })}`;

export default function RevenueOverTimeChart({ data }: RevenueOverTimeChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-16">Sin datos</p>
    );
  }

  const revenueByMonth: Record<string, number> = {};
  for (const shipment of data) {
    const month = shipment.created_at.substring(0, 7);
    revenueByMonth[month] =
      (revenueByMonth[month] ?? 0) + parseFloat(shipment.shipping_cost);
  }

  const chartData = Object.entries(revenueByMonth)
    .map(([month, revenue]) => ({ month, revenue, label: formatMonth(month) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.8} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
        <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={72} />
        <Tooltip
          contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--card-foreground)' }}
          labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
          itemStyle={{ color: 'var(--muted-foreground)' }}
          formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Ingresos']}
          labelFormatter={(label) => `Mes: ${label}`}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#16a34a"
          strokeWidth={2}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
