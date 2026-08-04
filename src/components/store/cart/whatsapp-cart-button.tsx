"use client";

import * as React from "react";
import { MessageCircle } from "lucide-react";
import { useCart } from "@/modules/cart/cart-context";
import { buildWhatsAppCartMessage, buildWhatsAppUrl } from "@/modules/whatsapp/cart-message";
import { getStoreContentAction } from "@/app/(store)/site-content-actions";
import { useAnalytics } from "@/modules/analytics/analytics-context";

const FALLBACK_INTRO = "Hola, quiero realizar este pedido:";
const FALLBACK_CLOSING_NOTE = "(Este es un resumen de mi carrito, no un pedido pagado.)";

/** Envía el resumen del carrito por WhatsApp (sección 20.2). */
export function WhatsAppCartButton({ onClick }: { onClick?: () => void }) {
  const { lines, totals, coupon } = useCart();
  const { track } = useAnalytics();
  const contentRef = React.useRef<{ whatsapp: string; intro: string; closingNote: string } | null>(null);

  React.useEffect(() => {
    getStoreContentAction().then(({ brand, texts }) => {
      contentRef.current = { whatsapp: brand.whatsapp, intro: texts.whatsappCartIntro, closingNote: texts.whatsappCartClosingNote };
    });
  }, []);

  const handleClick = () => {
    const content = contentRef.current;
    const message = buildWhatsAppCartMessage({
      lines,
      totals,
      couponCode: coupon?.code ?? null,
      intro: content?.intro ?? FALLBACK_INTRO,
      closingNote: content?.closingNote ?? FALLBACK_CLOSING_NOTE,
    });
    // Contacto desde el carrito: se reporta con el valor real del carrito,
    // que es lo que permite comparar la demanda que sale por WhatsApp
    // contra la que termina comprando en la tienda.
    track("Contact", {
      value: totals.productsTotal.amount,
      currency: "COP",
      contentIds: lines.map((line) => line.productId),
      contentType: "product",
      extra: { source: "cart" },
    });
    window.open(buildWhatsAppUrl(message, content?.whatsapp), "_blank", "noopener,noreferrer");
    onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex h-control-md w-full items-center justify-center gap-2 rounded-md border border-[#25D366] text-sm font-medium text-[#0F7F43] transition-colors duration-fast hover:bg-[#25D366]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      Enviar carrito por WhatsApp
    </button>
  );
}
