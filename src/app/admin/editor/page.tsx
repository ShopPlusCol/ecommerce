import type { Metadata } from "next";
import { Blocks } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Editor visual" };

export default function AdminPageBuilderPage() {
  return (
    <AdminModulePlaceholder
      title="Editor visual"
      description="Constructor por secciones (no lienzo libre) para la página de inicio y páginas editoriales."
      icon={Blocks}
      plannedFields={[
        "Bloques: hero, banner, carrusel, colecciones, testimonios, FAQ, CTA y más",
        "Borrador, vista previa segura, publicación e historial de versiones",
        "Reordenamiento con drag-and-drop y alternativa accesible",
        "Plantillas: Halloween, Día de la Madre, lanzamiento, etc.",
      ]}
    />
  );
}
