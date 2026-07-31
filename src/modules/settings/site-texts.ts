import { eq } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { settings } from "@/infrastructure/db/schema";

export type SiteTextsSettings = {
  headerAnnouncement: string;
  whatsappInquiryTemplate: string;
  whatsappCartIntro: string;
  whatsappCartClosingNote: string;
  checkoutPaymentDisclaimer: string;
  shippingPageMedellinBody: string;
  shippingPageRestBody: string;
  shippingPageNote: string;
};

export const DEFAULT_SITE_TEXTS: SiteTextsSettings = {
  headerAnnouncement: "Envío el mismo día en Medellín · Lentes cosméticos sin fórmula",
  whatsappInquiryTemplate: "Hola, tengo una pregunta sobre los lentes de {marca}.",
  whatsappCartIntro: "Hola, quiero realizar este pedido:",
  whatsappCartClosingNote: "(Este es un resumen de mi carrito, no un pedido pagado.)",
  checkoutPaymentDisclaimer:
    "El pedido se registra al confirmar. Mercado Pago solo aparece cuando está configurado; las transferencias quedan pendientes de revisión y un comprobante no equivale a pago aprobado.",
  shippingPageMedellinBody:
    "Entrega el mismo día pidiendo antes de la hora límite. Puedes pagar contraentrega en efectivo o datáfono. La tarifa exacta depende de tu barrio y se calcula en el checkout.",
  shippingPageRestBody:
    "El costo de envío se paga por anticipado; el valor de los productos queda como saldo contraentrega, salvo que elijas pagar todo por adelantado. El tiempo estimado de entrega depende de la transportadora y la ciudad de destino.",
  shippingPageNote:
    "Las tarifas, tiempos y coberturas exactos se administran desde el panel por zona y barrio (país › departamento › ciudad › barrio), y se muestran en tiempo real durante el checkout.",
};

export async function getSiteTextsSettings(): Promise<SiteTextsSettings> {
  const db = await getRuntimeDb();
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "site_texts")).limit(1);
  if (!row?.value || typeof row.value !== "object") return DEFAULT_SITE_TEXTS;
  return { ...DEFAULT_SITE_TEXTS, ...(row.value as Partial<SiteTextsSettings>) };
}
