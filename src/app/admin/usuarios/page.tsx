import type { Metadata } from "next";
import { Users } from "lucide-react";
import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export const metadata: Metadata = { title: "Usuarios y roles" };

export default function AdminUsersPage() {
  return (
    <AdminModulePlaceholder
      title="Usuarios y roles"
      description="Propietario, administrador, operaciones, editor de contenido y analista de solo lectura."
      icon={Users}
      plannedFields={[
        "Inicio de sesión seguro con recuperación de contraseña",
        "Sesiones revocables y cierre de todas las sesiones",
        "Permisos por recurso y acción, configurables por el propietario",
      ]}
    />
  );
}
