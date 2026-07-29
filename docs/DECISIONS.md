# DECISIONS

Decisiones tomadas sin instrucción literal en `PROMPT_MAESTRO.md`, con su justificación (sección 48: se documentan para no depender de la memoria del chat).

## Stack y versiones

- **Next.js 16.2.12 / React 19.2.4 / Tailwind v4** — versiones estables actuales al momento de iniciar el proyecto. Next 16 incluye un aviso propio (`AGENTS.md` generado por `create-next-app`) de que hay cambios de ruptura frente a versiones anteriores; se verificó cada convención relevante (App Router, `params`/`searchParams` asíncronos, metadata, proxy) contra la documentación empaquetada en `node_modules/next/dist/docs` antes de usarla.
- **`middleware.ts` → `proxy.ts`** — Next.js 16 marcó `middleware` como obsoleto en favor de `proxy` (mismo comportamiento, nuevo nombre de archivo/función). Se adoptó la convención nueva desde el inicio.
- **`@opennextjs/cloudflare` en vez de `@cloudflare/next-on-pages`** — `next-on-pages` solo soporta Next.js ≤ 15.5.2; `@opennextjs/cloudflare` es el adaptador oficial vigente y sí soporta Next 16.2.11+. Se confirmó el rango de compatibilidad contra el `package.json` publicado del paquete antes de instalarlo.
- **Drizzle ORM sobre SQLite (better-sqlite3 en Node, D1 en Cloudflare)** — mismo dialecto SQL en ambos destinos, migraciones legibles, sin bloquear una futura migración a Postgres (el adaptador vive detrás de `infrastructure/db/client.ts`).
- **`@paralleldrive/cuid2`** para IDs — librería mantenida, sin depender de autoincrementales de un motor concreto (portabilidad).

## Diseño visual

- **Tipografías**: Fraunces (display/editorial, con ejes ópticos) + Manrope (UI/cuerpo), ambas de licencia libre vía `next/font/google` (auto-hospedadas, sin llamadas externas en runtime). Se evitó cualquier tipografía propietaria de Apple/Dior.
- **Paleta**: base cálida/clara (`cream`), carbón para contraste, "cereza" (`cherry`) como acento de marca — corresponde a la dirección cromática sugerida en la sección 5.2 sin copiar composiciones de una marca concreta.
- **Tokens**: variables CSS crudas (`--tk-*`) mapeadas a namespaces de Tailwind v4 (`--color-*`, `--radius-*`, `--shadow-*`, `--ease-*`, `--duration-*`, `--spacing-control-*`) en `src/app/globals.css`, para que las utilidades generadas (`bg-brand`, `rounded-lg`, `ease-standard`, `h-control-md`...) usen el sistema propio sin arbitrary-values dispersos por el código.

## Acciones comerciales deshabilitadas en la Fase 1

Catálogo, carrito y checkout completos son entregables de la **Fase 2**. Para no violar la regla de "no botones falsos" ni adelantar lógica de negocio que la Fase 2 debe construir (revalidación de servidor, persistencia de carrito, motor de recompensas), los CTA de compra (`Agregar al carrito`, `Enviar mensaje`, `Consultar estado`) se muestran **deshabilitados** junto a un rótulo honesto (`PhaseNotice`: "Disponible en la Fase X"), en vez de simularse como funcionales. La navegación (enlaces a catálogo/producto/categoría, WhatsApp, formulario de búsqueda) sí es real y funcional porque no depende de infraestructura futura.

## Autenticación provisional del seed

El usuario propietario creado por `db:seed` usa hash `scrypt` (`node:crypto`, sin dependencias nuevas) en vez de una librería de autenticación completa, porque el login real (sesiones, cookies, roles aplicados) es un entregable explícito de la Fase 3. El esquema de hash puede mantenerse o migrarse a una librería dedicada según la UX que se necesite en esa fase (2FA, etc.).

## Tabla `promotions` (sección 28.6)

El prompt maestro lista `promotions` como tabla distinta de `coupons` y `reward_rules`. Para no duplicar lógica de descuento, se modeló como una tabla ligera de **campaña**: agrupa IDs de cupones y reglas de recompensa bajo un nombre y fechas, usada para reportar "promociones activadas y redimidas" (sección 3.1) en el panel. La lógica de descuento sigue viviendo únicamente en `coupons` y `reward_rules`.

## Tabla `color_families` (no listada explícitamente en la sección 28.6)

Se creó una tabla dedicada para familias de color (miel, gris, verde, azul, Halloween) en vez de modelarlas como una rama más del árbol de `categories`, porque el prompt las trata como un eje de filtrado y de tarjeta de producto distinto de la jerarquía de categorías (secciones 2.1, 8.3, 9). Reduce ambigüedad en consultas de catálogo.

## Dockerfile sin `output: "standalone"`

`@opennextjs/cloudflare` construye sobre el build estándar de Next.js; forzar `output: "standalone"` en `next.config.ts` es una optimización pensada para el modo Node y podría interferir con el proceso de extracción del adaptador de Cloudflare. El `Dockerfile` usa `next build` + `next start` (copia `node_modules` completo) — funcional y portable, con una imagen algo más pesada que la variante standalone. Optimizarlo con una instalación de producción separada queda como mejora futura no bloqueante.

## `compatibility_date` de Wrangler

Se fijó una fecha conocida y estable (`2024-09-23`, con `nodejs_compat` + `global_fetch_strictly_public`) en `wrangler.jsonc` en vez de una fecha arbitraria futura. Antes de desplegar a producción, confirmar si conviene actualizarla (ver `docs/DEPLOYMENT.md`).

## Vulnerabilidades de `npm audit` en dependencias de build

`npm audit` reporta CVEs altos en `postcss`/`sharp` (bundleados por Next.js 16, aún sin parche corriente) y en `minimatch`/ESLint tooling (dev-only). Todas son herramientas de build/tiempo de desarrollo, no código que procese entrada de usuarios no confiable en producción; forzar el "fix" propuesto por `npm audit fix --force` degradaría Next.js a una versión antigua (9.x), lo cual es peor. Se deja documentado para revisar cuando Next.js publique un patch.

---

# Decisiones de la Fase 2

## Datos de desarrollo detrás de puertos, no en las páginas

El catálogo, cupones, recompensas, zonas de envío y la página de inicio se sirven mediante adaptadores de datos de desarrollo (`infrastructure/demo/`, `infrastructure/catalog|promotions|shipping|pages/`) que implementan puertos (`CatalogRepository`, `PromotionsRepository`, `ShippingRateResolver`, `PageRepository`). La tienda importa solo desde `lib/container.ts`. Esto cumple "toda interacción debe seguir los contratos definitivos; evita crear una segunda lógica que luego haya que eliminar": en la Fase 3 se sustituye el adaptador demo por uno Drizzle/D1 sin tocar componentes de la tienda.

## Cálculo de precios único para cliente y servidor

La lógica de totales, cupones, recompensas, envío y división de pago vive en `domain/services/` como funciones puras. El cliente la usa para respuesta inmediata (drawer, checkout) y las Server Actions la reutilizan para el cálculo autoritativo. No hay una segunda implementación en el frontend (sección 1.3). Las Server Actions reconstruyen el carrito desde el catálogo por ID, ignorando los precios enviados por el cliente (sección 29).

## Pedido de checkout de demostración, sin persistir ni cobrar

La Server Action `createDemoOrderAction` calcula el resumen financiero autoritativo y genera un número de pedido, pero **no** escribe en la base de datos ni cobra: la persistencia de pedidos, Mercado Pago y las transferencias son entregables de la Fase 3. El pedido resultante se pasa a la confirmación vía `sessionStorage`. Esto evita fingir una integración de pago activa (sección 1.3) manteniendo un recorrido completo evaluable.

## Editor visual: modelo de bloques renderizado ya en la tienda

La página de inicio se define como un arreglo de bloques tipados (`modules/page-builder/blocks.ts`) que coincide con la tabla `page_sections`. La tienda ya renderiza ese contrato (`components/store/page-builder/`). En la Fase 2 la definición vive en un adaptador demo; en la Fase 3 el editor administrativo producirá exactamente esta estructura y se leerá la versión publicada desde la base de datos. Así el trabajo de render no se rehace.

## Analítica con gate de consentimiento; `Purchase` en el servidor

La capa de analítica (`modules/analytics`) registra eventos solo tras el consentimiento (banner de cookies, sección 32). Genera `event_id` para deduplicación navegador/servidor. `Purchase` **no** se dispara desde el navegador como verdad definitiva (sección 21.3): se reserva para la confirmación del backend en la Fase 3. En la Fase 2 los eventos se registran en un buffer en memoria y en consola (desarrollo), detrás del mismo contrato que despachará a Meta.

## `set-state-in-effect`: hidratación desde almacenamiento del navegador

Los proveedores de carrito, favoritos, consentimiento y la confirmación hidratan su estado desde `localStorage`/`sessionStorage` dentro de un `useEffect` de montaje. Esto es intencional para que el HTML del servidor y el primer render del cliente coincidan (evita desajustes de hidratación); el estado guardado se aplica después. La regla `react-hooks/set-state-in-effect` marca este patrón como falso positivo y se desactiva puntualmente con justificación en cada punto. El efecto de cotización de envío del checkout es un efecto de obtención de datos (sistema externo) y sigue el mismo criterio.
