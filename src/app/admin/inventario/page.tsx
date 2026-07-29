import type { Metadata } from "next";
import { Layers } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Inventario" };

export default function AdminInventoryPage() {
  return (
    <AdminModulePlaceholder
      title="Inventario"
      description="Stock disponible, reservado y vendido, con movimientos auditables."
      icon={Layers}
      plannedFields={[
        "Ajuste manual con motivo y umbral de stock bajo",
        "Liberación de reserva al expirar el checkout o fallar el pago",
        "Prevención de sobreventa mediante transacción",
        "Importación y exportación de inventario",
      ]}
    />
  );
}
