import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Pedidos" };

export default function AdminOrdersPage() {
  return (
    <AdminModulePlaceholder
      title="Pedidos"
      description="Tabla, filtros y línea de tiempo de cada pedido."
      icon={ClipboardList}
      plannedFields={[
        "Filtros por estado, fecha, ciudad, barrio, método de pago y de entrega",
        "Vista detallada con línea de tiempo y notas internas",
        "Cambio de estado y registro de pago",
        "Detección de pedidos duplicados y acciones masivas seguras",
        "Exportación CSV",
      ]}
    />
  );
}
