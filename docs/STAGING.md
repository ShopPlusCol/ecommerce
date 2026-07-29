# STAGING

## Separación obligatoria

Staging debe usar Worker, D1, buckets R2, URLs, Better Auth, Mercado Pago
sandbox, Meta Test Event y SMTP distintos de producción. `wrangler.jsonc`
incluye `env.staging`, mantenimiento activo y placeholders; no existen recursos
creados por esta fase.

## Secuencia

1. Obtener autorización para crear D1/R2/Worker.
2. Ejecutar los comandos de [DEPLOYMENT.md](./DEPLOYMENT.md).
3. Aplicar migraciones y seed de demostración claramente identificado.
4. Desplegar con `npm run cf:deploy:staging`.
5. Verificar `/api/health`, login/logout, texturas, pedido, comprobante,
   consulta, exportación y logs.
6. Probar Mercado Pago solo con sandbox y webhook firmado.
7. Probar Meta solo con Test Events, consentimiento y autorización.
8. Probar recuperación SMTP sin enumeración.
9. Ejecutar Lighthouse/axe/responsive contra la URL remota.
10. Conservar mantenimiento hasta cerrar hallazgos.

## Criterio de salida

No promover si hay secretos en archivos, errores de consola, migración sin
backup, recursos compartidos con producción, contenido temporal, textos legales
pendientes, pagos reales activos o eventos Meta fuera de Test Events.
