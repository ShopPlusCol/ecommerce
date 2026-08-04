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

## Entorno de pruebas (staging)

Hay dos formas de tener un staging. **La local no necesita ningún recurso en
la nube y es la que debe usarse para la validación previa al lanzamiento.**

### Opción A — Staging local (recomendada para validar)

```bash
npm run staging:seed   # una sola vez: crea .data/staging.db con datos de ejemplo
npm run staging        # arranca en http://localhost:3300
npm run staging:clean  # borra los datos de prueba al terminar
```

Qué queda separado de desarrollo y de producción:

| Recurso | Producción / desarrollo | Staging |
| --- | --- | --- |
| Base de datos | `.data/local.db` o D1 | `.data/staging.db` |
| Archivos subidos | `public/uploads` | `public/uploads-staging` |
| Variables | `.env` | `.env.staging` |
| Mercado Pago | Según `.env` | **Forzado a modo prueba** |
| Número de pedido | `SPC-…` | `TEST-SPC-…` |
| Panel | Sin aviso | Franja "ENTORNO DE PRUEBAS" |

`scripts/run-staging.mjs` fuerza `APP_ENVIRONMENT=staging`,
`SQLITE_PATH`, `MEDIA_DIRECTORY` y `MERCADO_PAGO_TEST_MODE=true`
independientemente de lo que diga `.env`, y avisa si `META_PIXEL_ID` está
definido sin `META_TEST_EVENT_CODE` (los eventos irían como reales).

**No copia ningún secreto de producción.** Las credenciales de prueba se
ponen a mano en `.env.staging` (plantilla en `.env.staging.example`).

### Opción B — Staging en Cloudflare

`wrangler.jsonc` ya define el entorno `staging` con worker, D1 y buckets R2
separados, y `MAINTENANCE_MODE=true`.

**Requiere crear los recursos primero** (no están creados):

```bash
npx wrangler d1 create shoppluscol-db-staging
npx wrangler r2 bucket create shoppluscol-media-staging
npx wrangler r2 bucket create shoppluscol-ecommerce-staging-cache
```

Después hay que pegar el `database_id` real en `wrangler.jsonc` (hoy dice
`REPLACE_WITH_STAGING_D1_DATABASE_ID`) y cargar los secretos con
`npx wrangler secret put <NOMBRE> --env staging`.

Solo entonces:

```bash
npm run cf:preview:staging
npm run cf:deploy:staging
```

> `cf:deploy:staging` **publica** el worker. No lo ejecutes sin haber
> revisado antes que los recursos apuntan a staging y no a producción.

### Identificar y limpiar datos de prueba

Todo lo creado fuera de producción es reconocible:

- **Pedidos**: número con prefijo `TEST-`.
- **Productos de las pruebas E2E**: SKU con prefijo `TEST-`.
- **Eventos de Meta**: llevan `test_event_code` y aparecen solo en "Probar
  eventos", no en las métricas de campaña.

`npm run staging:clean` borra pedidos `TEST-`, sus eventos de analítica, los
clientes que quedan sin ningún pedido y los productos de prueba. Admite
`--dry-run` y **se niega a operar sobre una base que no sea staging** salvo
que se pase `--database=<ruta>` explícito.
