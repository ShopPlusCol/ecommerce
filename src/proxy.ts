import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const UTM_KEYS = ["source", "medium", "campaign", "content", "term"] as const;
const FIRST_COOKIE = "shoppluscol_utm_first";
const LAST_COOKIE = "shoppluscol_utm_last";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
const MAX_VALUE_LENGTH = 160;

/**
 * Captura la atribución de campaña **en el servidor**, antes de que exista
 * JavaScript en la página.
 *
 * Antes solo la capturaba un componente de cliente dentro de un `useEffect`,
 * así que la cookie no existía hasta que React hidrataba. Medido en el
 * navegador: justo después de cargar la portada la cookie todavía no está.
 * Quien llega desde un anuncio y toca un producto antes de que termine la
 * hidratación —en un Android modesto con datos móviles, que es el público
 * real de esta tienda— perdía su atribución por completo, y el pedido se
 * registraba como tráfico directo.
 *
 * El componente de cliente se mantiene: cubre las navegaciones internas y
 * escribe exactamente el mismo valor, y `first` solo se escribe si falta,
 * así que no compiten.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const params = request.nextUrl.searchParams;

  const attribution: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(`utm_${key}`);
    if (value) attribution[key] = value.slice(0, MAX_VALUE_LENGTH);
  }
  if (Object.keys(attribution).length === 0) return response;

  // Sin `encodeURIComponent`: `NextResponse.cookies.set` ya codifica el
  // valor al escribir la cabecera. Codificarlo aquí lo dejaba doblemente
  // codificado (`%257B`) y el JSON no se podía parsear al leerlo.
  const value = JSON.stringify(attribution);
  const options = {
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    sameSite: "lax" as const,
    secure: request.nextUrl.protocol === "https:",
    // Legible por el componente de cliente, que sigue cubriendo las
    // navegaciones internas: no puede ser httpOnly.
    httpOnly: false,
  };

  // La primera fuente nunca se sobrescribe: es la que dice qué campaña
  // trajo a la persona por primera vez.
  if (!request.cookies.has(FIRST_COOKIE)) {
    response.cookies.set(FIRST_COOKIE, value, options);
  }
  response.cookies.set(LAST_COOKIE, value, options);

  return response;
}

export const config = {
  // Solo páginas de la tienda: se excluyen API, estáticos, imágenes
  // optimizadas y el panel, donde la atribución no aplica.
  matcher: ["/((?!api|_next/static|_next/image|admin|acceso-admin|favicon.ico|uploads|uploads-staging).*)"],
};
