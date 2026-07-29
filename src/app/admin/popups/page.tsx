import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Pop-ups" };

export default function AdminPopupsPage() {
  return (
    <AdminModulePlaceholder
      title="Pop-ups"
      description="Campañas emergentes con segmentación y control de frecuencia."
      icon={Megaphone}
      plannedFields={[
        "Imagen móvil/escritorio, cupón opcional, páginas incluidas/excluidas",
        "Frecuencia por sesión o periodo, retardo, scroll e intención de salida",
        "Segmentación por UTM, carrito y dispositivo",
        "Impresiones, cierres, clics y conversiones (con consentimiento)",
      ]}
    />
  );
}
