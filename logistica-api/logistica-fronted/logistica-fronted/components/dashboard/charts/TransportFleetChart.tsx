'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Transport } from "@/lib/types";

const FLEET_COLORS: Record<string, string> = {
  truck: "#2563eb",
  van: "#d97706",
  motorcycle: "#16a34a",
};

const FLEET_LABELS: Record<string, string> = {
  truck: "Camión",
  van: "Furgoneta",
  motorcycle: "Moto",
};

const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--card-foreground)",
};

interface TransportFleetChartProps {
  data: Transport[];
}

export default function TransportFleetChart({ data }: TransportFleetChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-16">Sin datos</p>
    );
  }

  const counts: Record<string, number> = {};
  for (const t of data) {
    counts[t.vehicle_type] = (counts[t.vehicle_type] ?? 0) + 1;
  }

  const chartData = Object.entries(counts)
    .map(([type, value]) => ({
      name: type,
      label: FLEET_LABELS[type] ?? type,
      value,
    }))
    .sort((a, b) => b.value - a.value);

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
            <Cell
              key={entry.name}
              fill={FLEET_COLORS[entry.name] ?? "#64748b"}
              stroke="#ffffff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
          itemStyle={{ color: "var(--muted-foreground)" }}
          formatter={(value, name) => [Number(value ?? 0), String(name ?? '')]}
        />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
