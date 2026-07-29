# PROJECT_SPEC

La especificación vinculante es
[`PROMPT_MAESTRO.md`](../PROMPT_MAESTRO.md). ShopPlusCol es una tienda
es-CO/COP de lentes cosméticos sin fórmula, inicialmente orientada a Medellín y
envíos nacionales.

## Capacidades

- Catálogo, categorías, colecciones, búsqueda, favoritos y contenido.
- Carrito, cupones, recompensas, envío jerárquico, pago total/parcial,
  checkout, confirmación, comprobante y consulta privada.
- Administración persistente con RBAC, auditoría, catálogo, inventario,
  pedidos, pagos, clientes, contenido, configuración e integraciones.
- Simulador fotográfico local con fallback y texturas administrables.
- Cloudflare Workers/D1/R2 y alternativa Node/Docker.

## Reglas

- Precio, stock, envío y pago se revalidan en servidor.
- No se finge una integración activa ni una prueba externa.
- La foto del simulador no se sube.
- No hay secretos ni credenciales versionados.
- Producción requiere staging, backups, contenido definitivo, revisión legal y
  aprobación humana.

## Estado de fases

Fases 1–3 aprobadas. Fase 4 y su ampliación administrativa 4.1 están
implementadas localmente y pendientes de tres validaciones manuales finales.
No existe aprobación de producción.

Ver [PHASE_STATUS.md](./PHASE_STATUS.md),
[PHASE_4_1_MATRIX.md](./PHASE_4_1_MATRIX.md),
[PHASE_4_CHECKLIST.md](./PHASE_4_CHECKLIST.md) y
[DEPLOYMENT.md](./DEPLOYMENT.md).
