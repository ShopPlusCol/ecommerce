# DEPLOYMENT

La aplicación conserva el mismo dominio y esquema SQLite para Cloudflare
D1/Workers y Node/Docker. Esta guía prepara ambos destinos; no autoriza un
despliegue.

## Desarrollo local

```bash
npm ci
copy .env.example .env.local
npm run db:migrate
npm run db:seed
npm run dev
```

Completa `BETTER_AUTH_SECRET` y, en el primer seed, conserva la credencial
efímera fuera de Git. No uses credenciales de producción localmente.

## Build verificable

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run cf:build
```

`cf:build` solo genera `.open-next`; no crea ni publica recursos.

## Cloudflare staging: punto de autorización

No se ejecutó ninguno de los siguientes comandos. Cuando el propietario
autorice crear recursos externos:

```bash
npx wrangler login
npx wrangler d1 create shoppluscol-db-staging
npx wrangler r2 bucket create shoppluscol-media-staging
npx wrangler r2 bucket create shoppluscol-ecommerce-staging-cache
```

1. Copia el `database_id` entregado por D1 en
   `env.staging.d1_databases[0].database_id` de `wrangler.jsonc`.
2. Confirma que los nombres de buckets coincidan.
3. Carga secretos de **prueba**, uno por uno:

```bash
npx wrangler secret put BETTER_AUTH_SECRET --env staging
npx wrangler secret put MERCADO_PAGO_ACCESS_TOKEN --env staging
npx wrangler secret put MERCADO_PAGO_WEBHOOK_SECRET --env staging
npx wrangler secret put META_CONVERSIONS_ACCESS_TOKEN --env staging
npx wrangler secret put SMTP_PASSWORD --env staging
```

4. Configura variables no secretas del entorno: `BETTER_AUTH_URL`,
   `NEXT_PUBLIC_SITE_URL`, `MEDIA_PUBLIC_URL`, `MERCADO_PAGO_TEST_MODE=true`,
   `META_PIXEL_ID`, `META_GRAPH_API_VERSION`, `SMTP_HOST`, `SMTP_USER` y
   `APP_REVISION`.
5. Aplica migraciones (Wrangler lee `migrations_dir: drizzle`):

```bash
npx wrangler d1 migrations apply shoppluscol-db-staging --remote --env staging
```

6. Solo tras revisar el diff y con autorización:

```bash
npm run cf:deploy:staging
```

Mantén `MAINTENANCE_MODE=true` hasta completar el smoke remoto. El despliegue
produce una URL pública de staging: trátala como un recurso externo real.

## Producción Cloudflare

Repite el proceso con recursos, URLs y secretos distintos; reemplaza únicamente
`REPLACE_WITH_REAL_D1_DATABASE_ID`. No reutilices D1, R2, credenciales ni
webhooks de staging. No ejecutes `npm run cf:deploy` sin aprobación final.
Configura dominio/HTTPS después del smoke de staging, nunca antes.

## Node/Docker

```bash
docker compose build
docker compose run --rm app npm run db:migrate
docker compose run --rm app npm run db:seed
docker compose up -d
```

`docker-compose.yml` monta volúmenes persistentes para `.data` y
`public/uploads`, usa `/api/health` y lee `.env.local`, que no se versiona.
Alternativa sin Compose:

```bash
docker build -t shoppluscol-ecommerce .
docker run --env-file .env.local -p 3000:3000 \
  -v shoppluscol-data:/app/.data \
  -v shoppluscol-uploads:/app/public/uploads \
  shoppluscol-ecommerce
```

Docker no estaba instalado en la máquina de validación; el Dockerfile se
verificó mediante el build Node equivalente, typecheck y revisión estática.

## Integraciones externas

- Mercado Pago: usa sandbox, URL pública de staging y secreto de webhook. No
  cambies `MERCADO_PAGO_TEST_MODE` a `false` hasta aprobar conciliación,
  idempotencia, rechazo y reembolso.
- Meta: mantén la integración deshabilitada. Usa Test Events únicamente después
  de consentimiento y autorización. Nunca envíes una `Purchase` de navegador
  como fuente autoritativa.
- SMTP: prueba recuperación con una cuenta de staging y confirma que la
  respuesta pública no enumere correos.
- R2: configura `MEDIA_BUCKET`, `NEXT_INC_CACHE_R2_BUCKET` y `MEDIA_PUBLIC_URL`;
  verifica carga, lectura, borrado y CORS.

## Rollback

1. Activa mantenimiento.
2. Conserva backup/exportación antes de migrar.
3. Despliega la versión anterior solo si sus lecturas son compatibles.
4. Una reversión de código **no revierte D1/SQLite**. Usa una migración de
   reversión revisada o restaura un backup validado.
5. Ejecuta `/api/health`, login, catálogo, pedido y consulta antes de reabrir.

Ver [RECOVERY.md](./RECOVERY.md), [STAGING.md](./STAGING.md) y
[PHASE_4_CHECKLIST.md](./PHASE_4_CHECKLIST.md).
