import type { Metadata } from "next";
import { ShoppingCart } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Colecciones" };

export default function AdminCollectionsPage() {
  return (
    <AdminModulePlaceholder
      title="Colecciones"
      description="Colecciones manuales, dinámicas por reglas, programadas o destacadas."
      icon={ShoppingCart}
      plannedFields={[
        "Reglas por categoría, etiqueta, precio, stock, fecha o ventas",
        "Recomendaciones globales, por categoría, producto, carrito o colección",
        "Prioridad determinista y visible",
      ]}
    />
  );
}
