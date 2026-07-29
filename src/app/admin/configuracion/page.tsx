import type { Metadata } from "next";
import { Cog } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Configuración" };

export default function AdminSettingsPage() {
  return (
    <AdminModulePlaceholder
      title="Configuración"
      description="Ajustes generales de marca, modo mantenimiento y notificaciones."
      icon={Cog}
      plannedFields={[
        "Modo mantenimiento (hoy controlado por variable de entorno)",
        "Canales de notificación y su estado de configuración",
        "Zona horaria, moneda y datos legales del negocio",
      ]}
    />
  );
}
