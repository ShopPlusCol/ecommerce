"use client";

import { MessageCircle } from "lucide-react";
import type { BrandSettings } from "@/modules/settings/brand";
import { useAnalytics } from "@/modules/analytics/analytics-context";

/**
 * Botón flotante de WhatsApp. Enlace real a wa.me: no depende de ninguna
 * integración de backend. Número y marca vienen de la configuración
 * persistida.
 *
 * Registra `Contact` al pulsarlo, que es el evento que permite medir cuánta
 * demanda entra por WhatsApp frente a la que compra en la tienda. Como todo
 * evento, solo sale si hay consentimiento: el `track` lo decide, no este
 * componente.
 */
export function WhatsAppFloatButton({ brand, inquiryTemplate }: { brand: BrandSettings; inquiryTemplate: string }) {
  const { track } = useAnalytics();
  const message = encodeURIComponent(inquiryTemplate.replace("{marca}", brand.name));
  const href = `https://wa.me/${brand.whatsapp}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      onClick={() => track("Contact", { extra: { source: "float_button" } })}
      className="tk-whatsapp-float fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-fast ease-standard hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
    </a>
  );
}
