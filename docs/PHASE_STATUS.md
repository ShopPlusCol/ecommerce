# PHASE_STATUS

## Fase actual

**Fase 1 — Fundamentos, arquitectura y UX.** Cerrada, a la espera de `LUZ VERDE` del propietario para iniciar la Fase 2.

## Completado en esta fase

- **Auditoría del repositorio**: al iniciar, el repositorio solo contenía `PROMPT_MAESTRO.md` y `.gitignore`. Todo lo demás se creó desde cero.
- **Proyecto Next.js 16** (App Router, TypeScript estricto, Turbopack, ESLint) con estructura modular (`domain/`, `application/`, `infrastructure/`, `modules/`, `components/`).
- **Sistema de diseño**: tokens de color/tipografía/espaciado/radio/sombra/movimiento en `src/app/globals.css` (Tailwind v4 `@theme`), tipografías Fraunces + Manrope, componentes base (`Button`, `Card`, `Chip`, `Input`, `Container`, `Section`, `Skeleton`, `QuantityStepper`, `EmptyState`).
- **Tienda pública navegable** con contenido de ejemplo: las 22 rutas de la sección 6 del prompt maestro (inicio, catálogo, categoría, colección, búsqueda, producto, favoritos, carrito, checkout + confirmación, consulta de pedido, FAQ, cuidados, envíos, devoluciones, privacidad, términos, contacto, páginas editoriales, 404, error recuperable, mantenimiento).
- **Panel administrativo navegable** con las 20 secciones de la sección 22.3, sidebar agrupado, y descripción honesta de qué administrará cada módulo cuando se conecte.
- **Modelo de datos completo**: 56 tablas Drizzle (ver `docs/DATA_MODEL.md`), migración inicial generada y aplicada, seed de demostración ejecutado con éxito (categorías, familias de color, 7 productos, colección "Más vendidos", FAQ, 2 zonas de envío, 1 cupón desactivado, roles y usuario propietario).
- **Contratos de portabilidad**: `PaymentProvider`, `StorageProvider`, `AnalyticsProvider`, `NotificationProvider`, `ShippingRateResolver` definidos en `application/ports/`, sin ninguna integración real todavía (correcto para esta fase).
- **Despliegue**: configuración de Cloudflare Workers (`wrangler.jsonc`, `open-next.config.ts`) y alternativa Docker/Node (`Dockerfile`), ambas documentadas en `docs/DEPLOYMENT.md`.
- **Calidad**: Vitest (6 pruebas unitarias sobre `Money`), Playwright (prueba de humo de navegación), ESLint y `tsc --noEmit` sin errores, `next build` exitoso (39 rutas generadas).
- **Documentación**: los seis archivos exigidos en `docs/`, más `README.md` y `.env.example` completos.

## Pendiente (explícitamente fuera de alcance de esta fase)

- Toda funcionalidad transaccional real: carrito persistente, checkout, cálculo de envío en servidor, cupones/recompensas aplicados, favoritos persistentes (Fase 2).
- Autenticación y persistencia real del panel administrativo, Mercado Pago, Meta Conversions API, WhatsApp configurable, auditoría (Fase 3).
- Simulador de lentes por foto, hardening final de seguridad/rendimiento, despliegue a producción (Fase 4).

## Decisiones relevantes

Ver `docs/DECISIONS.md` — incluye la elección de Next.js 16 y su convención `proxy` (antes `middleware`), `@opennextjs/cloudflare` como adaptador, la tabla `promotions` como agregador de campaña, y el manejo de CTAs de compra deshabilitados en vez de simulados.

## Errores conocidos / limitaciones aceptadas

- El panel administrativo es accesible sin login (esperado en esta fase; no desplegar públicamente así — ver `docs/ADMIN_GUIDE.md`).
- `npm audit` reporta vulnerabilidades altas en dependencias de build (`postcss`/`sharp` empaquetadas por Next 16, tooling de ESLint) — son de tiempo de construcción, no de runtime expuesto a usuarios; ver justificación en `docs/DECISIONS.md`.
- El Dockerfile copia `node_modules` completo (sin modo standalone) — funcional pero no optimizado en tamaño de imagen.
- `wrangler.jsonc` tiene un `database_id` de marcador de posición; debe reemplazarse antes de desplegar de verdad a Cloudflare.

## Siguiente acción autorizada

Ninguna todavía. **Detenido, esperando `LUZ VERDE` del usuario** para iniciar la Fase 2 (tienda pública y experiencia de compra completa).
