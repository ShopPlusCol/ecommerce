import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Los comprobantes admiten hasta 8 MB. El MB adicional cubre los
    // encabezados y límites propios de multipart/form-data.
    serverActions: {
      bodySizeLimit: "9mb",
    },
  },
  images: {
    // Habilitado solo para las imágenes de marcador de posición locales en
    // /public/demo (SVG generados por el propio proyecto, no subidos por
    // usuarios). Se retirará cuando existan fotografías reales de producto.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
