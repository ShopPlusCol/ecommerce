import type { Metadata } from "next";
import { BadgePercent } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Promociones" };

export default function AdminPromotionsPage() {
  return (
    <AdminModulePlaceholder
      title="Promociones"
      description="Motor de recompensas configurable para aumentar el ticket promedio."
      icon={BadgePercent}
      plannedFields={[
        "Envío gratis, producto gratuito, descuento fijo o porcentual",
        "Condición por monto, cantidad, combinación, categoría o zona",
        "Prioridad, acumulable, fechas de vigencia y límite total",
        "Vista previa y explicación de qué regla ganó ante conflictos",
      ]}
    />
  );
}
