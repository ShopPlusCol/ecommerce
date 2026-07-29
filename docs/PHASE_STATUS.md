# PHASE_STATUS

## Fase actual

**Fase 3 — Backend, administrador e integraciones: completada técnicamente en
`fase-3-codex`.** Base: `3740797` (`Cierre final de la Fase 2`). La Fase 2
continúa aprobada y la Fase 4 no está iniciada.

## Entregado en Fase 3

- Persistencia SQLite/D1 mediante Drizzle y migraciones `0001`–`0004`, probadas
  desde una base vacía. Seed seguro, idempotente y sin contraseña pública fija.
- Better Auth con contraseña hasheada, sesiones revocables, cookies seguras,
  logout, recuperación desacoplada de SMTP, rate limit, bloqueo por identidad,
  cinco roles, permisos por recurso/acción y auditoría.
- Todo `/admin` requiere sesión verificada en servidor. Los módulos muestran
  datos reales; productos, estados de pedido, inventario y marca tienen
  operaciones persistentes protegidas.
- Repositorios demo sustituidos por adaptadores Drizzle para catálogo,
  promociones, envíos y páginas publicadas.
- Checkout persistente e idempotente: recalcula en servidor, crea cliente,
  instantánea de pedido, pago y consentimiento, reserva stock condicionalmente
  y entrega un token privado de consulta.
- Inventario con disponible/reservado/vendido, movimientos y reservas
  temporales. Los webhooks verificados de Mercado Pago consumen la reserva una
  sola vez y nunca confían en la pantalla de retorno.
- Medios PNG/JPEG/WebP/SVG sanitizado con validación real, límite de 8 MB,
  dimensiones y adaptadores local/R2. Identidad de marca persistida en
  `settings`, con fallback textual y metadata dinámica.
- CSV de productos con validación por fila, prevención de duplicados, informe
  de aceptadas/rechazadas, importación masiva, exportación y auditoría.
- Panel real para catálogo, inventario, pedidos, clientes, envíos, pagos,
  marketing, contenido, analítica, integraciones, usuarios y auditoría.

## Integraciones y estado honesto

- **Mercado Pago:** implementación Checkout Pro y webhook firmado lista; falta
  aportar `MERCADO_PAGO_ACCESS_TOKEN` y `MERCADO_PAGO_WEBHOOK_SECRET` de prueba
  para validar contra la cuenta externa.
- **Meta CAPI:** contrato, persistencia, consentimiento y diagnóstico
  preparados; falta `META_PIXEL_ID`, `META_CONVERSIONS_ACCESS_TOKEN` y
  autorización antes de enviar eventos reales.
- **SMTP:** recuperación/notificaciones desacopladas; falta configurar
  `SMTP_HOST`, `SMTP_USER` y `SMTP_PASSWORD` y elegir/validar el transporte.
- **R2:** adaptador preparado; no se creó ningún bucket. Requiere binding
  `MEDIA_BUCKET` y `MEDIA_PUBLIC_URL`.

## Verificación

- `npm run typecheck`, `npm run lint`, `npm run test` (37), `npm run build`.
- Playwright: storefront, protección de `/admin`, login y logout reales (3).
- Migraciones sobre base vacía y seed ejecutado dos veces (idempotencia).
- Revisión de secretos, rutas administrativas y datos inventados completada.

## Siguiente acción

Esperar validación manual y una nueva `LUZ VERDE`. No iniciar la Fase 4.
