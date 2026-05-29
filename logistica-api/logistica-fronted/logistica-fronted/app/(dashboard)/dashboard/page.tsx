import DashboardKpis from "@/components/dashboard/DashboardKpis";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumen operativo de envíos y logística</p>
      </div>
      <DashboardKpis />
      <DashboardCharts />
    </div>
  );
}
