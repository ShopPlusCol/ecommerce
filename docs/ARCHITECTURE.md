# ARCHITECTURE

## Principio rector: puertos y adaptadores

El dominio y la lógica de aplicación no importan APIs de un proveedor concreto (Cloudflare, Mercado Pago, Meta). Dependen de **interfaces** (`application/ports/*`); la infraestructura implementa esas interfaces para cada proveedor. Cloudflare es un destino de despliegue, no el diseño del dominio (sección 28.1 del prompt maestro).

```
src/
  app/                    Next.js App Router
    (store)/              Rutas públicas + layout con header/footer/WhatsApp
    admin/                 Panel administrativo + layout con sidebar
    api/                   Route handlers (vacío hasta Fase 2/3)
    proxy.ts               Modo mantenimiento (convención "proxy" de Next 16, antes "middleware")
  components/
    ui/                    Sistema de diseño: Button, Card, Chip, Input, Section, Container...
    store/                 Header, footer, tarjeta de producto, botón WhatsApp
    admin/                 Sidebar, topbar, placeholders de módulo
  domain/
    entities/              Tipos del dominio (catálogo, pedido)
    value-objects/         Money (entero COP, sin punto flotante)
    errors/                 Errores de dominio tipados
  application/
    ports/                  Contratos: PaymentProvider, StorageProvider, AnalyticsProvider,
                             NotificationProvider, ShippingRateResolver
    use-cases/              (vacío hasta Fase 2: aquí vivirá la lógica de checkout, etc.)
  infrastructure/
    db/                     Drizzle: esquema, cliente (better-sqlite3 y D1), migrate/seed
    cloudflare/             Acceso a bindings de Cloudflare (D1, R2) vía @opennextjs/cloudflare
    storage/ payments/ analytics/ notifications/  (adaptadores concretos, se implementan
                             en las fases donde cada integración se activa)
  modules/                  Lógica de negocio por dominio (auth/password.ts implementado;
                             el resto son carpetas de extensión para Fase 2/3)
  lib/                      Utilidades transversales (cn, fuentes, config de marca, datos demo)
tests/
  unit/                     Vitest
  e2e/                      Playwright
```

## Por qué esta base (sección 28.2)

- **Next.js 16 (App Router)** — SSR/SSG combinados, Server Components para reducir JS público, Route Handlers tipados para la API.
- **Tailwind CSS v4** — tokens de diseño vía `@theme` en CSS (ver `src/app/globals.css`), sin duplicar valores en JS.
- **Drizzle ORM sobre SQLite** — mismo dialecto SQL en desarrollo (better-sqlite3) y en Cloudflare (D1); migraciones legibles y versionadas en `drizzle/`.
- **@opennextjs/cloudflare** — adaptador oficial vigente para Next.js en Workers (reemplaza a `@cloudflare/next-on-pages`, que no soporta Next 16).
- **@paralleldrive/cuid2** — IDs de texto colisión-resistentes, sin depender de autoincrementales ligados a un motor concreto.

## Portabilidad (sección 40)

| Necesidad | Adaptador Cloudflare | Adaptador Node/Docker |
| --- | --- | --- |
| Base de datos | D1 (`drizzle-orm/d1`) | better-sqlite3 (`drizzle-orm/better-sqlite3`) — mismo esquema |
| Medios | R2 (binding `MEDIA_BUCKET`, sección 23.4) | Disco local / cualquier S3-compatible |
| Runtime | Workers (`wrangler.jsonc`) | `Dockerfile` (Node 22) |

El código de dominio y aplicación es idéntico en ambos destinos; solo cambia qué adaptador se inyecta en `infrastructure/`.

## Estado de la proxy/middleware

Next.js 16 renombró `middleware.ts` a `proxy.ts` (mismo comportamiento, función exportada `proxy` en vez de `middleware`). Este proyecto ya usa la convención nueva desde el inicio para evitar deuda técnica.

## Decisiones de modelado no cubiertas literalmente por el prompt

Ver [`DECISIONS.md`](./DECISIONS.md).
