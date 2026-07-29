/**
 * Configuración inicial de marca y contacto. Valores de desarrollo seguros:
 * editables desde el panel en fases posteriores (sección 25 del prompt maestro).
 */
export const siteConfig = {
  brandName: "ShopPlusCol",
  tagline: "Lentes de contacto cosméticos, sin fórmula",
  description:
    "Tienda premium de lentes de contacto cosméticos sin fórmula. Envíos en Medellín y el Área Metropolitana, y a toda Colombia.",
  locale: "es-CO",
  currency: "COP",
  timeZone: "America/Bogota",
  contact: {
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "573000000000",
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hola@shoppluscol.com",
  },
  social: {
    instagram: "https://instagram.com/shoppluscol",
    facebook: "https://facebook.com/shoppluscol",
    tiktok: "https://tiktok.com/@shoppluscol",
  },
} as const;
