# ADMIN_GUIDE

## Acceso

1. Ejecuta `npm run db:migrate` y `npm run db:seed`.
2. Guarda la contraseña que el seed imprime únicamente al crear la credencial.
3. Abre `/acceso-admin`. `/admin` redirige al login sin cookie y vuelve a
   validar sesión/estado del usuario contra la base de datos.

El owner local usa el correo `ADMIN_OWNER_EMAIL` (por defecto
`owner@shoppluscol.local`). Define `ADMIN_OWNER_PASSWORD` antes del primer seed
si no quieres una contraseña aleatoria. Nunca la publiques ni la versionas.

## Roles

| Rol | Alcance |
| --- | --- |
| Propietario | Acceso total |
| Administrador | Todo excepto eliminar propietarios |
| Operaciones | Pedidos, inventario, clientes, envíos y pagos |
| Editor de contenido | Catálogo, promociones, contenido y medios |
| Analista de solo lectura | Lectura y exportación |

Todas las mutaciones vuelven a autorizar por recurso/acción en el servidor; no
se confía en ocultar botones.

## Operación

- **Productos:** crear, cambiar estado, importar/exportar CSV y consultar datos
  reales. El CSV requiere `sku,name,slug,price,status`.
- **Inventario:** el ajuste exige cantidad y motivo; se rechaza si invade stock
  reservado. Checkout crea reservas temporales auditables.
- **Pedidos:** estados de pedido, pago y envío son independientes. Cada cambio
  de estado crea línea de tiempo y auditoría.
- **Configuración:** identidad de marca, logos por URL de `media_assets`,
  favicon, Open Graph, contacto y redes. Nunca uses base64.
- **Integraciones:** solo muestra presencia/estado de configuración, nunca
  tokens. No declares pruebas externas exitosas sin credenciales.
- **Auditoría:** conserva actor, acción, entidad, antes/después y motivo.

## Recuperación y bloqueo

Tras cinco fallos se bloquea la identidad durante 15 minutos; Better Auth añade
rate limit persistente. La recuperación siempre responde de forma genérica. Sin
SMTP configurado no se envía correo y el panel lo comunica honestamente.
