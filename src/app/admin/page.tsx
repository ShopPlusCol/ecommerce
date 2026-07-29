import type { Metadata } from "next";
import { BarChart3, ClipboardList, PackageSearch, Wallet } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Resumen" };

const KPI_CARDS = [
  { label: "Ventas del mes", icon: Wallet },
  { label: "Pedidos", icon: ClipboardList },
  { label: "Ticket promedio", icon: BarChart3 },
  { label: "Stock bajo", icon: PackageSearch },
];

export default function AdminDashboardPage() {
  return (
    <>
      <AdminPageHeader
        title="Resumen"
        description="Indicadores en tiempo real una vez existan pedidos reales conectados a la base de datos (Fase 3)."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{kpi.label}</span>
                <kpi.icon className="h-4 w-4 text-text-subtle" aria-hidden="true" />
              </div>
              <span className="font-display text-2xl font-semibold text-text-subtle">—</span>
              <span className="text-xs text-text-subtle">Sin datos todavía</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-text">Pedidos recientes</p>
            <p className="mt-8 text-center text-sm text-text-subtle">
              Aún no hay pedidos. Aparecerán aquí en cuanto se conecte el checkout (Fase 2) y la
              base de datos (Fase 3).
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-text">Ventas por ciudad</p>
            <p className="mt-8 text-center text-sm text-text-subtle">
              Este gráfico se activa cuando existan pedidos con ciudad de entrega registrada.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
