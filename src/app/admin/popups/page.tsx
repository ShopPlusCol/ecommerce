import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEntitySection } from "@/components/admin/admin-entity-section";
import type { AdminEntityField } from "@/components/admin/admin-entity-form";
import { adminStatusLabel } from "@/modules/admin/status-labels";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { coupons, popups } from "@/infrastructure/db/schema";

export default async function Page() {
  await requirePermission("promotions", "read");
  const db = await getRuntimeDb();
  const [rows, couponRows] = await Promise.all([db.select().from(popups), db.select().from(coupons)]);
  const fields: AdminEntityField[] = [
    { name: "name", label: "Nombre interno (solo para ti, no se muestra)", required: true, placeholder: "Ej. Bienvenida 10%" },
    { name: "title", label: "Título visible", placeholder: "¡Bienvenida!" },
    { name: "body", label: "Mensaje", type: "textarea", placeholder: "Obtén 10% en tu primera compra." },
    { name: "imageUrlDesktop", label: "Imagen (escritorio)", type: "url" },
    { name: "imageUrlMobile", label: "Imagen (móvil, opcional; si la dejas vacía se usa la de escritorio)", type: "url" },
    { name: "ctaLabel", label: "Texto del botón", placeholder: "Ver catálogo" },
    { name: "ctaHref", label: "Destino del botón", placeholder: "/catalogo" },
    { name: "couponId", label: "Mostrar este cupón dentro del pop-up (opcional)", type: "select", options: couponRows.map((coupon) => ({ value: coupon.id, label: coupon.code })) },
    { name: "status", label: "Estado", type: "select", required: true, options: [{ value: "draft", label: "Borrador (no se muestra)" }, { value: "active", label: "Activo (se muestra en la tienda)" }, { value: "paused", label: "Pausado" }, { value: "expired", label: "Vencido" }] },
    { name: "frequency", label: "¿Con qué frecuencia se repite para la misma persona?", type: "select", required: true, options: [{ value: "once_per_session", label: "Una vez por visita" }, { value: "once_per_period", label: "Una vez por semana" }, { value: "always", label: "Cada vez que entra a una página válida" }] },
    { name: "delaySeconds", label: "Esperar antes de mostrarlo (segundos)", type: "number", min: 0 },
    { name: "triggerOnScrollPercent", label: "O mostrarlo al desplazarse este % de la página (opcional)", type: "number", min: 0, max: 100 },
    { name: "triggerOnExitIntent", label: "O mostrarlo cuando la persona intenta salir (solo escritorio)", type: "checkbox" },
    { name: "priority", label: "Prioridad (si hay varios activos, gana el número más alto)", type: "number" },
    { name: "includedPaths", label: "Mostrar solo en estas páginas (rutas separadas por coma; vacío = todas)", placeholder: "/, /catalogo" },
    { name: "excludedPaths", label: "No mostrar en estas páginas (separadas por coma)", placeholder: "/checkout" },
    { name: "startsAt", label: "Inicio (opcional)", type: "datetime-local" },
    { name: "endsAt", label: "Fin (opcional)", type: "datetime-local" },
  ];
  return (
    <>
      <AdminPageHeader title="Pop-ups" description="Segmentación por ruta, frecuencia, disparadores y programación." />
      <p className="mb-5 max-w-3xl rounded-lg border border-info/30 bg-info-soft p-4 text-sm text-info">
        Solo se muestra un pop-up a la vez, el de mayor prioridad entre los elegibles. Debe estar en estado
        “Activo” y, si defines fechas, dentro de ese rango. El cierre siempre es visible y funciona con teclado (Esc).
      </p>
      <AdminEntitySection entity="popup" title="Pop-ups" description="Los borradores y pausados nunca se muestran en la tienda." fields={fields} records={rows.map((row) => ({ id: row.id, name: row.name, imageUrlMobile: row.imageUrlMobile, imageUrlDesktop: row.imageUrlDesktop, title: row.title, body: row.body, ctaLabel: row.ctaLabel, ctaHref: row.ctaHref, couponId: row.couponId, includedPaths: row.includedPaths?.join(", ") ?? "", excludedPaths: row.excludedPaths?.join(", ") ?? "", frequency: row.frequency, delaySeconds: row.delaySeconds, triggerOnScrollPercent: row.triggerOnScrollPercent, triggerOnExitIntent: row.triggerOnExitIntent, priority: row.priority, status: row.status, startsAt: row.startsAt, endsAt: row.endsAt }))} recordTitle={(record) => `${record.name} · ${adminStatusLabel(String(record.frequency))} · ${adminStatusLabel(String(record.status))}`} />
    </>
  );
}
