import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Contenido" };

export default function AdminContentPage() {
  return (
    <AdminModulePlaceholder
      title="Contenido"
      description="Marca, contacto, FAQ, cuidados, avisos y textos del checkout."
      icon={Newspaper}
      plannedFields={[
        "Nombre de marca, logo, favicon y colores dentro de límites seguros",
        "WhatsApp, redes sociales, horarios y mensajes de entrega",
        "Editor de texto enriquecido saneado",
        "SEO global y datos para compartir",
      ]}
    />
  );
}
