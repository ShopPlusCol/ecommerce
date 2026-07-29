# ShopPlusCol — E-commerce

Tienda virtual premium de lentes de contacto cosméticos sin fórmula (Medellín y Colombia). Especificación completa en [`PROMPT_MAESTRO.md`](./PROMPT_MAESTRO.md); estado de fase en [`docs/PHASE_STATUS.md`](./docs/PHASE_STATUS.md).

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript estricto · Tailwind CSS v4 · Drizzle ORM (SQLite/D1) · Vitest · Playwright · despliegue portable a Cloudflare Workers (`@opennextjs/cloudflare`) o Node/Docker.

## Requisitos

- Node.js ≥ 20.9
- npm

## Instalación

```bash
npm install
cp .env.example .env
```

`.env.example` documenta cada variable y su propósito; los valores de ejemplo son seguros para desarrollo.

## Base de datos (SQLite local)

```bash
npm run db:generate   # genera migraciones a partir del esquema Drizzle
npm run db:migrate    # aplica migraciones sobre ./.data/local.db
npm run db:seed       # datos de ejemplo (catálogo, zonas, FAQ, usuario propietario)
```

`db:seed` imprime en consola la contraseña generada del usuario propietario (`owner@shopluscol.local`). Guárdala: no se vuelve a mostrar. El login real llega en la Fase 3; por ahora sirve como registro de que el flujo de creación de usuarios funciona.

## Desarrollo

```bash
npm run dev
```

Tienda pública en `/`, panel administrativo en `/admin` (sin autenticación todavía — ver aviso en la propia interfaz).

## Calidad

```bash
npm run typecheck
npm run lint
npm run test        # unitarias (Vitest)
npm run test:e2e     # end-to-end (Playwright; requiere `npx playwright install` una vez)
npm run build
```

## Despliegue

Ver [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) para Cloudflare Workers y para la alternativa portable con Docker/Node.

## Documentación del proyecto

| Archivo | Contenido |
| --- | --- |
| [`docs/PROJECT_SPEC.md`](./docs/PROJECT_SPEC.md) | Resumen ejecutivo del producto y alcance por fase |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Arquitectura de puertos y adaptadores, estructura de carpetas |
| [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) | Modelo de datos y relaciones (56 tablas) |
| [`docs/DECISIONS.md`](./docs/DECISIONS.md) | Decisiones técnicas y su justificación |
| [`docs/PHASE_STATUS.md`](./docs/PHASE_STATUS.md) | Qué fase está activa, qué falta, próxima acción autorizada |
| [`docs/ADMIN_GUIDE.md`](./docs/ADMIN_GUIDE.md) | Guía del panel administrativo |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Guía de despliegue Cloudflare y Docker/Node |
