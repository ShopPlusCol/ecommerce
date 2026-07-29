"use client";

import { MessageCircle } from "lucide-react";
import { useCart } from "@/modules/cart/cart-context";
import { buildWhatsAppCartMessage, buildWhatsAppUrl } from "@/modules/whatsapp/cart-message";

/** Envía el resumen del carrito por WhatsApp (sección 20.2). */
export function WhatsAppCartButton({ onClick }: { onClick?: () => void }) {
  const { lines, totals, coupon } = useCart();

  const handleClick = () => {
    const message = buildWhatsAppCartMessage({ lines, totals, couponCode: coupon?.code ?? null });
    window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
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
