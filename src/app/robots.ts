import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Rutas transaccionales o de administración no deben indexarse (sección 35).
      disallow: ["/admin", "/checkout", "/carrito", "/favoritos", "/buscar", "/api"],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
