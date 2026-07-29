# DEPLOYMENT

Dos destinos soportados desde la Fase 1: **Cloudflare Workers** (costo bajo inicial) y **Node/Docker** (portabilidad, sección 40). El dominio de negocio es idéntico en ambos; solo cambia el adaptador de infraestructura.

## Cloudflare Workers

### Requisitos previos

1. Cuenta de Cloudflare y `npx wrangler login`.
2. Crear la base D1: `npx wrangler d1 create shopluscol-db` y copiar el `database_id` real en `wrangler.jsonc` (reemplazar `REPLACE_WITH_REAL_D1_DATABASE_ID`).
3. Crear los buckets R2: `npx wrangler r2 bucket create shopluscol-media` y `npx wrangler r2 bucket create shopluscol-ecommerce-opennext-cache`.
4. Aplicar migraciones sobre D1: `npx wrangler d1 migrations apply shopluscol-db --remote` (usa los archivos de `drizzle/`).
5. Confirmar `compatibility_date` en `wrangler.jsonc` (ver `docs/DECISIONS.md`) — puede actualizarse a la fecha vigente si conviene.

### Build y despliegue

```bash
npm run cf:build      # opennextjs-cloudflare build
npx wrangler dev       # preview local sobre el runtime de Workers
npm run cf:deploy      # opennextjs-cloudflare deploy
```

### Variables y secretos

Nunca en `wrangler.jsonc` en texto plano salvo valores no sensibles (`MAINTENANCE_MODE`). Secretos reales:

```bash
npx wrangler secret put MERCADOPAGO_ACCESS_TOKEN
npx wrangler secret put META_CONVERSIONS_API_TOKEN
npx wrangler secret put SESSION_SECRET
```

## Node / Docker (Hostinger, Railway, VPS, etc.)

```bash
docker build -t shopluscol-ecommerce .
docker run -p 3000:3000 --env-file .env shopluscol-ecommerce
```

La imagen no usa `output: "standalone"` (ver `docs/DECISIONS.md`); usa `next start` sobre el build completo. Para esta ruta, la base de datos es SQLite local (`better-sqlite3`) o, si se desea, un adaptador PostgreSQL futuro detrás de la misma interfaz `Db` (`src/infrastructure/db/client.ts`) — no está implementado todavía porque el volumen inicial (50-100 pedidos/mes) no lo requiere.

## Migraciones y rollback

- Las migraciones son versionadas y viven en `drizzle/`; se generan con `npm run db:generate` y se aplican con `npm run db:migrate` (local) o `wrangler d1 migrations apply` (Cloudflare).
- **Revertir el código de la aplicación no revierte cambios de base de datos.** Antes de un rollback de release, confirmar si la migración más reciente es compatible con la versión anterior del código o si hace falta una migración de reversión explícita.

## Checklist antes de producción (ampliar en la Fase 4)

- [ ] Credenciales reales de Mercado Pago y Meta cargadas como secretos, no en `.env` versionado.
- [ ] `database_id` real en `wrangler.jsonc`.
- [ ] Dominio propio configurado y HTTPS activo.
- [ ] `MAINTENANCE_MODE` probado en al menos un despliegue.
- [ ] Backups de D1/SQLite verificados y con restauración probada al menos una vez.
- [ ] Revisión de secretos y contenido temporal (sección 1.3) completada.
