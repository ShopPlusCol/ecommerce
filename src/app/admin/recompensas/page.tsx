import type { Metadata } from "next";
import { Gift } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Recompensas" };

export default function AdminRewardsPage() {
  return (
    <AdminModulePlaceholder
      title="Recompensas"
      description="Reglas de recompensa y su rendimiento (costo y uso real)."
      icon={Gift}
      plannedFields={[
        "Mensaje de progreso y de beneficio desbloqueado",
        "Métodos de envío y pago válidos por regla",
        "Costo de la recompensa y número de redenciones",
      ]}
    />
  );
}
