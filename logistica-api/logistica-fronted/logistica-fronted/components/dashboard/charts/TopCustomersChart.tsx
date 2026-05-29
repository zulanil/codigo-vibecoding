'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { Shipment, Customer } from "@/lib/types";

interface TopCustomersChartProps {
  shipments: Shipment[];
  customers: Customer[];
}

const BAR_COLORS = [
  '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#4f92f7',
  '#60a5fa', '#74b3fb', '#93c5fd', '#a8d2fe', '#bfdbfe',
];

export default function TopCustomersChart({ shipments, customers }: TopCustomersChartProps) {
  if (shipments.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-16">Sin datos</p>
    );
  }

  const customerMap = new Map<number, string>(
    customers.map((c) => [c.id, c.name])
  );

  const countById: Record<number, number> = {};
  for (const shipment of shipments) {
    countById[shipment.customer] = (countById[shipment.customer] ?? 0) + 1;
  }

  const chartData = Object.entries(countById)
    .map(([idStr, count]) => {
      const id = Number(idStr);
      const name = customerMap.get(id) ?? `Cliente #${id}`;
      return { name, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const maxNameLen = Math.max(...chartData.map((d) => d.name.length), 0);
  const yAxisWidth = Math.min(Math.max(maxNameLen * 7, 80), 150);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
        <YAxis
          dataKey="name"
          type="category"
          width={yAxisWidth}
          tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
        />
        <Tooltip
          contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--card-foreground)' }}
          labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
          itemStyle={{ color: 'var(--muted-foreground)' }}
          formatter={(value: number) => [value, 'Envíos']}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={BAR_COLORS[index] ?? BAR_COLORS[BAR_COLORS.length - 1]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
