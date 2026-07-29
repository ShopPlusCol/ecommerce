# DEPLOYMENT

Dos destinos soportados desde la Fase 1: **Cloudflare Workers** (costo bajo inicial) y **Node/Docker** (portabilidad, sección 40). El dominio de negocio es idéntico en ambos; solo cambia el adaptador de infraestructura.

## Cloudflare Workers

### Requisitos previos

1. Cuenta de Cloudflare y `npx wrangler login`.
2. Crear la base D1: `npx wrangler d1 create shoppluscol-db` y copiar el `database_id` real en `wrangler.jsonc` (reemplazar `REPLACE_WITH_REAL_D1_DATABASE_ID`).
3. Crear los buckets R2: `npx wrangler r2 bucket create shoppluscol-media` y `npx wrangler r2 bucket create shoppluscol-ecommerce-opennext-cache`.
4. Aplicar migraciones sobre D1: `npx wrangler d1 migrations apply shoppluscol-db --remote` (usa los archivos de `drizzle/`).
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
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put MERCADO_PAGO_ACCESS_TOKEN
npx wrangler secret put MERCADO_PAGO_WEBHOOK_SECRET
npx wrangler secret put META_CONVERSIONS_ACCESS_TOKEN
npx wrangler secret put SMTP_PASSWORD
```

Configura además `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`,
`MERCADO_PAGO_TEST_MODE`, `MEDIA_PUBLIC_URL`, `META_PIXEL_ID`, `SMTP_HOST` y
`SMTP_USER`. El adaptador R2 usa el binding `MEDIA_BUCKET`; no se creó ningún
recurso real durante la Fase 3.

## Node / Docker (Hostinger, Railway, VPS, etc.)

```bash
docker build -t shoppluscol-ecommerce .
docker run -p 3000:3000 --env-file .env shoppluscol-ecommerce
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
- [ ] Login, logout, recuperación y rotación/revocación de sesiones probados.
- [ ] Firma del webhook de Mercado Pago validada con el simulador oficial.
