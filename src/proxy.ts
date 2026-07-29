import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { COOKIE_PREFIX } from "@/modules/auth/auth";

/**
 * Modo mantenimiento configurable sin bloquear el acceso administrativo
 * (sección 6, ítem 22). Controlado por la variable de entorno
 * MAINTENANCE_MODE ("true"/"false"); en fases posteriores se moverá a
 * `settings` en base de datos para que el administrador lo cambie sin
 * redeploy.
 */
const BYPASS_PREFIXES = ["/admin", "/api", "/mantenimiento", "/_next", "/favicon.ico"];

export function proxy(request: NextRequest) {
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !getSessionCookie(request, { cookiePrefix: COOKIE_PREFIX })) {
    const url = request.nextUrl.clone();
    url.pathname = "/acceso-admin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  let response: NextResponse;
  if (!isMaintenanceMode || BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    response = NextResponse.next();
  } else {
    const url = request.nextUrl.clone();
    url.pathname = "/mantenimiento";
    response = NextResponse.rewrite(url);
  }

  const utm = Object.fromEntries(
    ["source", "medium", "campaign", "content", "term"]
      .map((key) => [key, request.nextUrl.searchParams.get(`utm_${key}`)])
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
  if (Object.keys(utm).length) {
    const value = JSON.stringify(utm);
    const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 90, path: "/" };
    if (!request.cookies.has("shoppluscol_utm_first")) response.cookies.set("shoppluscol_utm_first", value, options);
    response.cookies.set("shoppluscol_utm_last", value, options);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
