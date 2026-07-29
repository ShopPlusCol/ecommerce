import type { Metadata } from "next";
import { Plug } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Integraciones" };

export default function AdminIntegrationsPage() {
  return (
    <AdminModulePlaceholder
      title="Integraciones"
      description="Estado de Mercado Pago, Meta Conversions API y WhatsApp, sin exponer secretos."
      icon={Plug}
      plannedFields={[
        "Estado de conexión, modo prueba/producción y diagnóstico sin tokens",
        "Registro de últimos eventos y webhooks",
        "Activar/desactivar cada integración de forma segura",
      ]}
    />
  );
}
