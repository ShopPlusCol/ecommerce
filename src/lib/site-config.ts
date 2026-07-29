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
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hola@shopluscol.com",
  },
  social: {
    instagram: "https://instagram.com/shopluscol",
    facebook: "https://facebook.com/shopluscol",
    tiktok: "https://tiktok.com/@shopluscol",
  },
} as const;
