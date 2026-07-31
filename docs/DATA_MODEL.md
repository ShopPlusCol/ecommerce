# DATA_MODEL

El esquema Drizzle vive en `src/infrastructure/db/schema/` y las migraciones
`0000`–`0006` en `drizzle/`. Usa SQLite portable entre better-sqlite3 y D1:
IDs CUID2, dinero COP entero, timestamps epoch, relaciones explícitas y JSON
solo para configuración validada.

## Dominios

- Identidad: usuarios administrativos, roles, permisos, sesiones, cuentas,
  verificaciones, rate limits y bloqueo de login.
- Catálogo/contenido: productos, variantes, medios, categorías, colecciones,
  atributos, páginas versionadas, navegación, FAQ y testimonios.
- Compra: clientes/direcciones, carritos, pedidos e instantáneas, ajustes,
  historial, pagos, comprobantes, reembolsos y webhooks.
- Inventario/envío: existencias, movimientos, reservas temporales, zonas,
  reglas y despachos.
- Marketing/sistema: cupones, promociones, recompensas, popups, settings,
  integraciones, consentimientos, analítica, auditoría e idempotencia.

## Fase 4

### `try_on_textures`

Una textura por producto con activo de medios opcional, URL, máscara, opacidad,
blend mode, escalas, rotación, perspectiva, corrección de color y estado
`pending/approved/rejected`. Solo texturas aprobadas de productos activos llegan
a la tienda. La foto del cliente nunca entra en esta tabla.

### `temporary_uploads`

Permanece disponible para una futura modalidad remota con expiración y borrado,
pero el simulador actual no la usa: procesa exclusivamente en el navegador.

### `request_rate_limits`

Clave anonimizada, alcance, contador, `reset_at` y `updated_at`. No guarda IP,
correo, foto ni contenido del pedido. Los contadores vencidos se reinician de
forma atómica.

### `settings.privacy`

JSON validado con versión, responsable, identificación/domicilio, correo,
plazos operativos de retención y estado de revisión legal.

## Exportación

`/api/admin/exports/data` y `npm run db:export` incluyen datos de negocio y
metadatos de medios. Excluyen contraseñas, cuentas Better Auth, sesiones,
tokens, rate limits, idempotencia y payloads de webhooks. Los binarios se
respaldan por separado desde R2 o el volumen `public/uploads`.

## Migraciones y recuperación

- Generar: `npm run db:generate`.
- Local: `npm run db:migrate`.
- D1: `wrangler d1 migrations apply <db> --remote --env <entorno>`.
- Nunca edites migraciones aplicadas; crea una nueva.
- Un rollback de aplicación no revierte el esquema.
