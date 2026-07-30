import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEntitySection } from "@/components/admin/admin-entity-section";
import type { AdminEntityField } from "@/components/admin/admin-entity-form";
import { adminStatusLabel } from "@/modules/admin/status-labels";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { faqs, testimonials } from "@/infrastructure/db/schema";

const statusOptions = [{ value: "draft", label: "Borrador" }, { value: "published", label: "Publicado" }];

export default async function Page() {
  await requirePermission("content", "read");
  const db = await getRuntimeDb();
  const [faqRows, testimonialRows] = await Promise.all([db.select().from(faqs), db.select().from(testimonials)]);
  const faqFields: AdminEntityField[] = [
    { name: "question", label: "Pregunta", required: true },
    { name: "answer", label: "Respuesta", type: "textarea", required: true },
    { name: "category", label: "Categoría" },
    { name: "order", label: "Orden", type: "number", min: 0 },
    { name: "status", label: "Estado", type: "select", required: true, options: statusOptions },
  ];
  const testimonialFields: AdminEntityField[] = [
    { name: "customerName", label: "Nombre", required: true },
    { name: "city", label: "Ciudad" },
    { name: "quote", label: "Testimonio", type: "textarea", required: true },
    { name: "rating", label: "Calificación", type: "number", min: 1, max: 5 },
    { name: "order", label: "Orden", type: "number", min: 0 },
    { name: "status", label: "Estado", type: "select", required: true, options: statusOptions },
  ];
  return (
    <>
      <AdminPageHeader title="Contenido" description="Preguntas frecuentes y testimonios publicados desde una fuente persistente." />
      <AdminEntitySection entity="faq" title="Preguntas frecuentes" description="Ordena y publica respuestas visibles en la tienda." fields={faqFields} records={faqRows.map((row) => ({ ...row }))} recordTitle={(record) => `${record.question} · ${adminStatusLabel(String(record.status))}`} />
      <AdminEntitySection entity="testimonial" title="Testimonios" description="Solo los publicados pueden aparecer en bloques públicos." fields={testimonialFields} records={testimonialRows.map((row) => ({ ...row }))} recordTitle={(record) => `${record.customerName} · ${record.rating ?? "sin calificación"} · ${adminStatusLabel(String(record.status))}`} />
    </>
  );
}
