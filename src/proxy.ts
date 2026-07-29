import { NextResponse, type NextRequest } from "next/server";

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

  if (!isMaintenanceMode || BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/mantenimiento";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
