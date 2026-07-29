import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

/**
 * Botón flotante de WhatsApp (sección 20.1). Enlace real a wa.me: no depende
 * de ninguna integración de backend, así que es funcional desde la Fase 1.
 * Número y mensaje se volverán editables desde el panel en la Fase 3.
 */
export function WhatsAppFloatButton() {
  const message = encodeURIComponent(
    `Hola, tengo una pregunta sobre los lentes de ${siteConfig.brandName}.`,
  );
  const href = `https://wa.me/${siteConfig.contact.whatsappNumber}?text=${message}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-fast ease-standard hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
    </a>
  );
}
