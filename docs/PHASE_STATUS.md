# PHASE_STATUS

## Fase actual

**Fase 2 — Tienda pública y experiencia de compra.** Cerrada, a la espera de `LUZ VERDE` del propietario para iniciar la Fase 3.

## Completado en la Fase 2

- **Capa de dominio de compra** (`src/domain/services/`), determinista y verificable en servidor y cliente sin duplicar lógica:
  - `cart-pricing.ts`: subtotal, descuentos, total de productos, resumen de pedido con **pagar ahora / pagar al recibir** (sección 16.4). Nunca produce totales negativos ni confunde anticipo con descuento.
  - `coupons.ts`: normalización, validación (vigencia, compra/cantidad mínima) y efecto (fijo, porcentual, envío gratis).
  - `rewards.ts`: motor de recompensas con barra de progreso hacia el siguiente beneficio.
  - `shipping.ts`: resolución jerárquica país › departamento › ciudad › barrio; la regla más específica gana; si ninguna aplica devuelve `null` ("cotización requerida"), sin inventar tarifa.
  - `payments.ts`: métodos disponibles por zona y división del pago (contra entrega, anticipo de envío + saldo, pago total).
- **Puertos y adaptadores de datos de desarrollo** (contratos definitivos): `CatalogRepository`, `PromotionsRepository`, `PageRepository` y `ShippingRateResolver`, con adaptadores demo en `infrastructure/` y composition root en `lib/container.ts`. La tienda depende solo de las interfaces; la Fase 3 cambia el adaptador demo por Drizzle/D1 sin tocar la tienda.
- **Estado de cliente con persistencia**: carrito (`modules/cart`) y favoritos (`modules/favorites`) en `localStorage`, con hidratación SSR-segura, deshacer eliminación, sincronización de cantidad entre tarjeta/producto/carrito/checkout y badge en el header.
- **Server Actions tipadas y validadas con Zod** (`app/(store)/actions.ts`): cotizar envío, validar cupón y **crear pedido de demostración** reconstruyendo el carrito desde el catálogo en servidor (no confía en precios del cliente, sección 29). Sin persistencia ni cobro real (eso es Fase 3).
- **Catálogo** con filtros (categoría, familia de color, disponibilidad, promoción), orden, búsqueda tolerante a tildes, chips de filtros activos, conteo, paginación, estados vacío/carga, y **URL compartible** que conserva filtros y orden.
- **Tarjeta y página de producto** conectadas al carrito real: stepper en tarjeta, agregar con confirmación, favorito, galería, relacionados, accesorios sugeridos (upsell), CTA fijo en móvil y datos estructurados JSON-LD.
- **Carrito completo**: drawer accesible (Escape, bloqueo de scroll, foco), página de respaldo, resumen financiero, campo de cupón (validado en servidor, recalculado en cliente), barra de progreso de recompensa, upsells y **envío del carrito por WhatsApp** con mensaje generado (identificado como resumen, no pedido pagado).
- **Checkout completo con pago parcial** (invitado, móvil-primero): contacto, ubicación (departamento/ciudad/barrio), cálculo de envío en vivo, selección de método de pago según la zona, resumen con **pagar ahora vs. pagar al recibir**, consentimiento diferenciado (términos vs. marketing) y confirmación de pedido de demostración con número.
- **Editor visual renderizado en la tienda**: la página de inicio se compone de **bloques** (`modules/page-builder/blocks.ts`) resueltos por un renderizador (`components/store/page-builder/`). Coincide con el contrato de `page_sections`; en la Fase 3 el editor administrativo producirá esta misma estructura.
- **Analítica desacoplada por interfaz** (`modules/analytics`): `PageView`, `ViewContent`, `AddToWishlist`, `AddToCart`, `InitiateCheckout`, `AddPaymentInfo`, con `event_id` para deduplicación y **gate de consentimiento** (banner de cookies; sin consentimiento no se registra nada). `Purchase` se reserva para la confirmación del backend en la Fase 3 (sección 21.3).
- **SEO**: metadata y canonical por página, Open Graph, JSON-LD (Organization, WebSite, Product/Offer, BreadcrumbList, FAQ), `sitemap.xml` y `robots.txt` (rutas transaccionales/admin no indexadas).
- **Calidad**: 28 pruebas unitarias (dinero, precios/pago parcial, cupones, recompensas, envío jerárquico), typecheck, lint y `next build` en verde (62 rutas; productos pre-generados por SSG).

## Refinamiento visual (pase enfocado, sin cambios de arquitectura)

Sobre la Fase 2 funcional se aplicó una mejora visual premium/editorial, priorizando tokens y componentes reutilizables (no reconstrucción):

- **Sistema**: sombras en capas, gradientes de marca (`warm`/`iris`), keyframes y utilidades de movimiento (150–450 ms, solo `transform`/`opacity`, con `prefers-reduced-motion`), componente `Reveal` (aparición al entrar al viewport, sin dependencias), tipografía con `text-wrap: balance/pretty`.
- **Botón**: forma píldora, elevación y sombra de marca en hover, `active:scale`.
- **Header**: marca centrada tipo editorial, barra de anuncio en franja oscura, subrayado animado en nav, badge de carrito con animación, sticky con elevación al hacer scroll, menú móvil ampliado.
- **Hero**: composición editorial con zona de fotografía preparada mediante placeholder elegante (macro de iris + rótulo), entrada animada.
- **Home**: "Elige por tono" con orbes de color y conteo real de tonos (scroll horizontal en móvil), ritmo variado por bloque (eyebrows, alineaciones, tonos alternos), `Reveal` en secciones, beneficios numerados, testimonios y CTA editoriales.
- **Tarjeta de producto**: imagen protagonista 4:5, acción rápida sobre la imagen (hover en escritorio, visible en móvil), menos contenedores, presentación de descuento clara.
- **Producto**: galería mayor y adhesiva en escritorio, jerarquía de precio con ahorro, tarjeta de envío/pagos, barra fija móvil con `safe-area`.
- **Carrito/checkout**: barra de progreso con degradado, pasos del checkout con insignias numeradas, tarjetas unificadas (radio `xl`).
- **Responsive**: verificado en 360/390/768/1440 sin desbordes; el botón flotante de WhatsApp se oculta en móvil cuando está la barra fija de producto para no solaparse.

Las reglas financieras, la lógica y los contratos no cambiaron. El contenido editable (hero, bloques, tonos) sigue viniendo del editor por bloques / repositorios, sin hardcodear datos administrables.

## Verificación en navegador realizada

Recorrido completo probado en local: home renderizada por bloques → producto → agregar al carrito (drawer con barra de progreso y cupón) → checkout con destino nacional (Bogotá) → envío cotizado $16.000 → método "envío ahora + saldo" → **pagar ahora $16.000 / pagar al recibir $49.000 / total $65.000** → confirmación con número de pedido. Filtros de catálogo por URL verificados. Sin errores de consola.

## Pendiente (fuera de alcance de la Fase 2)

- **Fase 3**: autenticación y panel real conectado a la base de datos, carga masiva de productos, Mercado Pago en pruebas, Conversions API real, webhooks idempotentes, cupones/promociones/pop-ups administrables, transferencias manuales, auditoría, notificaciones.
- **Fase 4**: simulador de lentes por foto, hardening de seguridad/rendimiento, Core Web Vitals, despliegue a producción.

## Naturaleza de los datos en la Fase 2

Los datos de catálogo, cupones, recompensas, zonas de envío y la página de inicio provienen de **adaptadores de datos de desarrollo** (`infrastructure/demo/`, `infrastructure/*`), no de la base de datos. Toda interacción pasa por los contratos definitivos (puertos), por lo que la Fase 3 conecta la base de datos sembrada sin reescribir la tienda. El pedido de checkout se calcula de forma autoritativa en servidor pero **no se persiste ni se cobra**.

## Errores conocidos / limitaciones aceptadas

- El pedido de confirmación se guarda en `sessionStorage` (demo); la consulta de pedidos por número y la persistencia real llegan en la Fase 3.
- El panel administrativo sigue sin autenticación (Fase 3); no desplegar públicamente así.
- `npm audit` reporta vulnerabilidades altas en dependencias de build (Next 16 / tooling ESLint) — de tiempo de construcción, no de runtime; ver `docs/DECISIONS.md`.
- `wrangler.jsonc` mantiene un `database_id` de marcador de posición.

## Siguiente acción autorizada

Ninguna todavía. **Detenido, esperando `LUZ VERDE` del usuario** para iniciar la Fase 3 (backend, administrador e integraciones).
