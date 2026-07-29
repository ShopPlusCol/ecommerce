# ADMIN_GUIDE

## Acceso

```bash
npm run db:migrate
npm run db:seed
```

El seed muestra la contraseña solo al crear la credencial. El correo proviene
de `ADMIN_OWNER_EMAIL`. Guarda ambos en un gestor de contraseñas; no en Git,
capturas, documentación ni chats compartidos. Abre `/acceso-admin`.

## Operación

- Productos: alta, estado, CSV y metadatos.
- Simulador: sube PNG/WebP cuadrado de hasta 2 MB, ajusta apariencia, guarda y
  aprueba solo tras revisar el producto real. Rechazar/pendiente no se publica.
- Inventario: todo ajuste requiere motivo y no puede invadir reservas.
- Pedidos/pagos: pedido y pago tienen estados separados. Un comprobante queda
  pendiente hasta revisión explícita; cargarlo nunca aprueba el pago.
- Configuración: identidad, transferencia, privacidad, retención y exportación.
- Estado del sistema: confirma DB/runtime/revisión y si una integración está
  configurada, sin mostrar secretos.
- Auditoría: revisa actor, acción, entidad y cambios antes/después.

## Privacidad

En Configuración completa responsable, datos legales, correo, versión y
retención. No marques “Revisada” hasta que el negocio/asesor competente la
valide. La foto del simulador no aparece en medios ni exportaciones porque
nunca llega al servidor.

## Exportación y recuperación

- Panel: Configuración → Exportar datos de negocio.
- CLI: `npm run db:export`.
- Backup: `npm run db:backup`.
- Restauración: sigue [RECOVERY.md](./RECOVERY.md); nunca restaures con la
  aplicación escribiendo sobre la misma base.

## Seguridad

Tras cinco intentos fallidos se bloquea la identidad temporalmente. Cerrar
sesión usa el endpoint de Better Auth y se verifica al volver a `/admin`.
La recuperación responde de forma genérica y requiere SMTP para enviar correo.

## Integraciones pendientes

Mercado Pago sandbox, Meta Test Events, SMTP y R2 requieren credenciales o
recursos externos. El panel dice “Pendiente” hasta una validación real. No
habilites modo producción ni Meta desde el panel por anticipado.
