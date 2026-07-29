import type { Metadata } from "next";
import { Ticket } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Cupones" };

export default function AdminCouponsPage() {
  return (
    <AdminModulePlaceholder
      title="Cupones"
      description="Códigos manuales o autogenerados, con atribución a creadores de contenido."
      icon={Ticket}
      plannedFields={[
        "Descuento fijo, porcentual, envío gratis o regalo",
        "Límite de usos total y por cliente, compra mínima, productos y zonas",
        "Atribución a creador, campaña o socio",
        "Analítica: usos, ventas brutas y netas, ticket promedio",
      ]}
    />
  );
}
