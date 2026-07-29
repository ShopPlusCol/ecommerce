import type { Metadata } from "next";
import { Users } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Clientes" };

export default function AdminCustomersPage() {
  return (
    <AdminModulePlaceholder
      title="Clientes"
      description="Ficha de cliente creada automáticamente al primer pedido, sin cuenta obligatoria."
      icon={Users}
      plannedFields={[
        "Direcciones, pedidos, valor total y ticket promedio",
        "Primera y última compra, cupones usados",
        "Consentimiento, notas internas y etiquetas",
        "Deduplicación prudente (sin fusión automática)",
      ]}
    />
  );
}
