import type { Metadata } from "next";
import { ChartBar } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Analítica" };

export default function AdminAnalyticsPage() {
  return (
    <AdminModulePlaceholder
      title="Analítica"
      description="Ventas, embudo de conversión y calidad de eventos enviados a Meta."
      icon={ChartBar}
      plannedFields={[
        "Ventas brutas y netas, ticket promedio, productos y tonos más vendidos",
        "Embudo: vista de producto, carrito, checkout iniciado y compra",
        "Uso y ventas por cupones y códigos de creadores",
        "Calidad de eventos de Meta y deduplicación por event_id",
      ]}
    />
  );
}
