# ARCHITECTURE

## Capas

```text
Next App Router (store/admin/API)
        │
Application ports + domain services
        │
Adapters: Drizzle, storage, pagos, analítica, notificaciones, try-on
        │
SQLite/Node-Docker ───────────── D1/R2/Cloudflare Workers
```

El dominio no importa Cloudflare, Mercado Pago ni Meta. `getRuntimeDb()`,
`StorageProvider`, `PaymentProvider`, `AnalyticsProvider`,
`NotificationProvider`, `ShippingRateResolver` y `TryOnRepository` contienen
los límites portables.

## Tienda y administrador

- `(store)` usa Server Components para datos y componentes cliente pequeños
  para carrito, consentimiento, checkout y UI.
- `/admin` vuelve a autenticar y autorizar en servidor por operación. No depende
  de ocultar controles.
- El modo mantenimiento vive en el layout público. Se retiró `proxy.ts` porque
  OpenNext no admite el runtime Node de Proxy en Workers; el administrador y
  APIs no quedan bloqueados.
- Headers de seguridad se definen en `next.config.ts`; admin y API son
  `no-store`.

## Simulador

`TryOnLauncher` se carga en productos de lentes, pero
`TryOnSimulator` y `@mediapipe/tasks-vision` son imports dinámicos. La foto se
convierte en un object URL local, se analiza en el navegador y se dibuja en
canvas. No hay endpoint de upload de fotos. Si el modelo no carga o no reconoce
el rostro, se usa geometría manual ajustable. Las texturas sí son activos
administrados, revisados y almacenados por el adaptador de medios.

El bundle analysis de Next confirmó que los chunks de MediaPipe no pertenecen a
la primera carga de `/productos/[slug]`.

## Seguridad y observabilidad

- Better Auth, RBAC, sesiones revocables y login con bloqueo/rate limit.
- Rate limiting adicional guarda únicamente hash de IP, alcance, contador y
  expiración.
- Logs estructurados JSON sin secretos; `/api/health` expone solo salud mínima.
- `/admin/estado` y `/api/admin/status` requieren permiso y muestran latencia,
  revisión, runtime y presencia de configuración, nunca valores.
- Web Vitals se reciben con esquema estricto y se registran como métricas
  técnicas; no contienen foto ni biometría.

## Portabilidad

| Necesidad | Cloudflare | Node/Docker |
| --- | --- | --- |
| SQL | D1 / `drizzle-orm/d1` | SQLite / `better-sqlite3` |
| Medios | R2 bindings | `public/uploads` persistente |
| Runtime | OpenNext Worker | Node 22 `next start` |
| Health | `/api/health` | `/api/health` + Docker healthcheck |
| Backup | D1 export/time travel | scripts SQLite + SHA-256 |

El dialecto actual es SQLite. Una futura migración a PostgreSQL exige un nuevo
cliente/adaptador y conversión de migraciones, pero no reescribir servicios del
dominio.
