# DATA_MODEL

Esquema completo en `src/infrastructure/db/schema/*.ts` (Drizzle, dialecto
SQLite — compatible D1 y better-sqlite3). Migraciones versionadas en
`drizzle/0000_*.sql` a `0004_*.sql`. 62 tablas organizadas por dominio.

## Convenciones

- **IDs**: texto (`cuid2`), generados en la aplicación, no autoincrementales.
- **Dinero**: entero en COP (`price`, `total`, etc.), nunca `real`/flotante — evita errores de redondeo (sección 23.1).
- **Timestamps**: `created_at`/`updated_at` en milisegundos epoch.
- **Snapshots**: `orders` y `order_items` copian nombre, SKU, precio y reglas aplicadas en el momento de la compra. Un cambio posterior en catálogo, zonas o promociones **no** altera pedidos históricos (sección 19.2).
- **JSON**: solo para configuración flexible ya validada (p. ej. `page_sections.config`, `shipping_rules.operating_days`), nunca como sustituto de relaciones (sección 28.5).

## Identidad y acceso (`identity.ts`)

`admin_users`, `roles`, `permissions`, `role_permissions`, `user_roles`,
`sessions`, `auth_accounts`, `auth_verifications`, `auth_rate_limits` y
`auth_login_attempts` — Better Auth, sesiones revocables y RBAC con cinco roles.
Las credenciales usan el hash mantenido por Better Auth; las cookies son
HttpOnly/SameSite y Secure en producción.

## Catálogo (`catalog.ts`)

`color_families`, `categories` (árbol auto-referenciado, sin ciclos por diseño de aplicación), `products`, `product_variants`, `product_media`, `attribute_definitions` + `product_attributes` (EAV controlado para especificaciones configurables), `product_categories`, `collections` + `collection_products`, `recommendation_rules` (upsell/cross-sell por alcance: global, categoría, producto, carrito, colección).

## Inventario (`inventory.ts`)

`inventory_items` (disponible/reservado/vendido por producto o variante), `inventory_movements` (auditoría de cada cambio: restock, venta, reserva, liberación, ajuste manual, devolución).

## Clientes (`customers.ts`)

`customers`, `customer_addresses`. Ficha creada al primer pedido; sin cuenta obligatoria.

## Carrito (`cart.ts`)

`carts` (con UTM de primera atribución y token de sesión), `cart_items` (con snapshot de precio unitario al agregar).

## Pedidos (`orders.ts`)

`orders` (37 columnas: contacto, dirección, snapshot de envío, totales, UTM, consentimiento — todo lo necesario para no depender de otras tablas al mostrar un pedido histórico), `order_items`, `order_adjustments` (cupón/promoción/recompensa/descuento manual, cada uno auditable), `order_status_history`.

Estados de pedido y de pago son campos **separados** (`orders.status` vs `orders.payment_status`), tal como exige la sección 19.1.

## Pagos (`payments.ts`)

`payments` (varias transacciones por pedido: anticipo de envío, saldo, pago total), `payment_events` (eventos crudos de webhook, deduplicados por `raw_event_id`), `refunds`.

## Envíos (`shipping.ts`)

`shipping_zones` (nivel país/departamento/ciudad/barrio), `shipping_rules` (tarifa, contraentrega, anticipo, mismo día, prioridad — la regla más específica gana, resuelto en `application/ports/shipping-rate-resolver.ts`), `shipments`.

## Marketing (`marketing.ts`)

`coupons` + `coupon_scopes` + `coupon_redemptions`, `promotions` (agrupa cupones/recompensas bajo una campaña con nombre, para reportar "promociones activadas y redimidas" sin duplicar lógica de descuento — ver DECISIONS.md), `reward_rules` + `reward_redemptions` (motor de barra de progreso), `popups`.

## Contenido (`content.ts`)

`pages` + `page_versions` + `page_sections` (editor visual por bloques con historial), `navigation_menus`, `testimonials`, `faqs`, `media_assets`.

## Sistema (`system.ts`)

`settings` (clave/valor JSON), `integration_settings` (estado de Mercado Pago/Meta/WhatsApp/SMTP, nunca el secreto), `webhook_events`, `analytics_events` (con `event_id` para deduplicación Meta), `consent_records`, `audit_logs`, `idempotency_keys`.

## Simulador (`try-on.ts`, Fase 4)

`try_on_textures`, `temporary_uploads` (con `expires_at` obligatorio — sección 27.2).

## Diagrama de relaciones clave

```
products ─┬─ product_media
          ├─ product_variants
          ├─ product_categories ── categories (árbol)
          ├─ inventory_items ── inventory_movements
          └─ color_families

carts ── cart_items ── products

orders ─┬─ order_items (snapshot)
        ├─ order_adjustments
        ├─ order_status_history
        ├─ payments ── payment_events / refunds
        ├─ shipments
        └─ coupon_redemptions / reward_redemptions
```
# Extensiones de Fase 3

- `auth_accounts`, `auth_verifications`, `auth_rate_limits` y
  `auth_login_attempts` completan Better Auth y el bloqueo persistente.
- `sessions.token` permite revocación real y conserva filas antiguas durante la
  migración.
- `orders.payment_method` y `orders.lookup_token_hash` guardan el método elegido
  y protegen la consulta pública.
- `inventory_reservations` separa reservas temporales de stock vendido y permite
  liberación/consumo idempotente.
- `media_assets`, `settings`, `webhook_events`, `audit_logs` e
  `idempotency_keys` son las fuentes autoritativas para medios, marca,
  integraciones, auditoría y deduplicación.
