import type { Metadata } from "next";
import { Tags } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Categorías" };

export default function AdminCategoriesPage() {
  return (
    <AdminModulePlaceholder
      title="Categorías"
      description="Árbol de categorías y familias de color, totalmente editable."
      icon={Tags}
      plannedFields={[
        "Crear, editar, archivar y reordenar categorías y subcategorías",
        "Imagen, icono, slug y descripción SEO",
        "Categoría padre y prevención de ciclos en la jerarquía",
        "Visibilidad en menú, filtros e inicio",
        "Creación de nuevas familias de color sin tocar código",
      ]}
    />
  );
}
