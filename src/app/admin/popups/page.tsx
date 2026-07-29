import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEntitySection } from "@/components/admin/admin-entity-section";
import type { AdminEntityField } from "@/components/admin/admin-entity-form";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { coupons, popups } from "@/infrastructure/db/schema";

export default async function Page() {
  await requirePermission("promotions", "read");
  const db = await getRuntimeDb();
  const [rows, couponRows] = await Promise.all([db.select().from(popups), db.select().from(coupons)]);
  const fields: AdminEntityField[] = [
    { name: "name", label: "Nombre interno", required: true },
    { name: "imageUrlMobile", label: "Imagen móvil", type: "url" },
    { name: "imageUrlDesktop", label: "Imagen escritorio", type: "url" },
    { name: "title", label: "Título" },
    { name: "body", label: "Mensaje", type: "textarea" },
    { name: "ctaLabel", label: "Texto del botón" },
    { name: "ctaHref", label: "Destino del botón" },
    { name: "couponId", label: "Cupón", type: "select", options: couponRows.map((coupon) => ({ value: coupon.id, label: coupon.code })) },
    { name: "includedPaths", label: "Rutas incluidas (separadas por coma)" },
    { name: "excludedPaths", label: "Rutas excluidas (separadas por coma)" },
    { name: "frequency", label: "Frecuencia", type: "select", required: true, options: [{ value: "once_per_session", label: "Una vez por sesión" }, { value: "once_per_period", label: "Una vez por periodo" }, { value: "always", label: "Siempre" }] },
    { name: "delaySeconds", label: "Retraso en segundos", type: "number", min: 0 },
    { name: "triggerOnScrollPercent", label: "Activar al desplazarse (%)", type: "number", min: 0, max: 100 },
    { name: "triggerOnExitIntent", label: "Activar al intentar salir", type: "checkbox" },
    { name: "priority", label: "Prioridad", type: "number" },
    { name: "status", label: "Estado", type: "select", required: true, options: [{ value: "draft", label: "Borrador" }, { value: "active", label: "Activo" }, { value: "paused", label: "Pausado" }, { value: "expired", label: "Vencido" }] },
    { name: "startsAt", label: "Inicio", type: "datetime-local" },
    { name: "endsAt", label: "Fin", type: "datetime-local" },
  ];
  return (
    <>
      <AdminPageHeader title="Pop-ups" description="Segmentación por ruta, frecuencia, disparadores y programación." />
      <AdminEntitySection entity="popup" title="Pop-ups" description="Los borradores y pausados nunca se muestran en la tienda." fields={fields} records={rows.map((row) => ({ id: row.id, name: row.name, imageUrlMobile: row.imageUrlMobile, imageUrlDesktop: row.imageUrlDesktop, title: row.title, body: row.body, ctaLabel: row.ctaLabel, ctaHref: row.ctaHref, couponId: row.couponId, includedPaths: row.includedPaths?.join(", ") ?? "", excludedPaths: row.excludedPaths?.join(", ") ?? "", frequency: row.frequency, delaySeconds: row.delaySeconds, triggerOnScrollPercent: row.triggerOnScrollPercent, triggerOnExitIntent: row.triggerOnExitIntent, priority: row.priority, status: row.status, startsAt: row.startsAt, endsAt: row.endsAt }))} recordTitle={(record) => `${record.name} · ${record.frequency} · ${record.status}`} />
    </>
  );
}
