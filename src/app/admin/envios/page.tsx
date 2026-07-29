import type { Metadata } from "next";
import { MapPinned } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Envíos y zonas" };

export default function AdminShippingPage() {
  return (
    <AdminModulePlaceholder
      title="Envíos y zonas"
      description="Jerarquía país › departamento › ciudad › barrio › excepción."
      icon={MapPinned}
      plannedFields={[
        "Tarifa fija, gratuita, umbral de envío gratis y recargos por sector",
        "Contraentrega, pago total anticipado o solo envío anticipado",
        "Días hábiles, hora límite y mismo día para Medellín y el Área Metropolitana",
        "Simulador de dirección: qué regla ganó y por qué",
        "Detección de reglas solapadas y programación de cambios de tarifa",
      ]}
    />
  );
}
