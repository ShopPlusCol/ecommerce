# CONVERSION_UX_AUDIT.md — Ronda de conversión y UX (2026-08-04)

Rama: `mejora-conversion-ecommerce-2026-08`, partiendo de `5bee800`.
No se hizo push, no se desplegó y no se aprobó producción.

## Contexto comercial

Datos del embudo aportados por el propietario: 304 conversaciones iniciadas,
50 útiles, 244 abandonadas o de baja calidad, 10 fuera de cobertura, 11
ventas (3,62 % de conversación a venta, ~$30.445 de costo publicitario por
venta).

La lectura de esos números orientó las prioridades: **244 conversaciones de
baja calidad y 10 fuera de cobertura significan que la tienda no estaba
respondiendo antes del clic a WhatsApp** las preguntas de precio, contenido,
cobertura y forma de pago. Cada una de esas dudas que la tienda resuelve
sola es una conversación que no hay que atender a mano.

## Problemas encontrados y qué se hizo

### 1. El primer pantallazo no vendía (alto impacto)

**Problema.** El hero decía "Cambia tu mirada, sin complicarte" y no mostraba
precio, ni qué incluye la compra, ni bajo qué condiciones se entrega. Alguien
que llegaba desde un anuncio no podía decidir sin preguntar.

**Cambio.** El hero muestra ahora precio ("Lentes + estuche desde $49.000"),
qué incluye y qué no incluye, y la promesa de entrega ya calificada. **El
precio no está escrito a mano**: sale del catálogo real mediante el marcador
`{precio}`, así que no puede quedar desactualizado.

**Detalle que importa:** el precio "desde" solo considera productos con
familia de color (los lentes). Tomar el mínimo de todo el catálogo hacía que
el hero anunciara "Lentes + estuche desde $15.000", que es el precio de una
pinza. Se detectó al verificar en navegador, no en código.

### 2. Promesas que la tienda no podía sostener (riesgo real)

**Problema.** "Entrega el mismo día en Medellín" aparecía como texto fijo en
el hero, en la ficha de producto, en los beneficios y en la barra del
encabezado — **sin importar la hora, la zona ni si la zona estaba activa**.
Lo mismo con "Paga contra entrega en Medellín y Área Metropolitana".

Es la causa más probable de una parte de los 10 contactos fuera de cobertura,
y de conversaciones que empiezan con una expectativa que hay que desmontar.

**Cambio.** Nuevo servicio de dominio `store-promise.ts` (puro y con
pruebas) + `storefront/offer.ts`:

- La promesa de mismo día solo se muestra si **alguna ciudad la tiene
  configurada** y **la hora local aún no pasó la hora límite**. Pasada esa
  hora, la línea desaparece en vez de prometer algo incumplible.
- Las ciudades salen del árbol real de zonas, resueltas con la **misma
  herencia que usa el checkout** (`resolveEffectiveZoneConfig`), no de una
  lista escrita a mano. Una zona inactiva o sin cobertura no promete.
- Siempre va acompañada de su aclaración ("según zona, disponibilidad, día y
  hora, antes de las 14:00").
- El contra entrega enumera las ciudades donde está realmente habilitado.

### 3. Testimonios inventados publicados como reales (riesgo legal)

**Problema.** Tres testimonios de ejemplo (Valentina R., Camila G., Mariana
P.) se publicaban como si fueran clientas reales.

**Cambio.** Un testimonio solo se publica si está marcado como verificado.
La regla la aplica el componente, no la disciplina de quien edita: en
producción los no verificados se filtran y, si no queda ninguno, **la sección
entera desaparece**. En desarrollo se ven marcados como "EJEMPLO · NO SE
PUBLICA". El editor tiene la casilla y un testimonio nuevo nace sin verificar.

### 4. No se medía nada (impide optimizar la inversión publicitaria)

**Problema.** **Meta Pixel no existía en el navegador.** `track()` solo
escribía en consola. La Conversions API se usaba únicamente desde el webhook
de pago. No había forma de saber qué campaña originaba cada pedido ni de
optimizar el anuncio.

**Cambio.** Ver `docs/ANALYTICS_EVENTS.md` para el detalle. En resumen:
píxel real cargado solo con consentimiento de marketing, nueve eventos
conectados, deduplicación navegador/servidor por `event_id` compartido, y
`Purchase` emitido solo desde servidor con garantía de una vez por pedido.

### 5. La ficha de producto no resolvía las dudas frecuentes

**Cambio.** Bloque "Incluye / No incluye" + aclaración de que el tono varía
según iris, luz y cámara. El CTA pasa de "Preguntar por WhatsApp" (consulta
abierta) a **"Comprar este tono por WhatsApp"**, y el mensaje llega resuelto:
producto, cantidad, precio, qué incluye, nota de domicilio y URL, dejando
solo el hueco de la ubicación.

Es el cambio dirigido más directamente a los 244 contactos de baja calidad:
quien escribe llega sabiendo el precio y qué recibe.

### 6. El aviso de privacidad podía tapar el checkout

**Cambio.** De barra a todo el ancho a tarjeta acotada (336 px a 360 px de
viewport), con tercera opción "Configurar" y las tres categorías separadas.
Mientras está visible reserva espacio real al final de la página.

### 7. Errores reales encontrados de paso

Ninguno era parte del encargo; se corrigieron porque bloqueaban lo pedido:

- **`ImageTextBlock` ignoraba su propia imagen**: guardaba `imageUrl` desde
  el panel pero renderizaba siempre el marcador. La fotografía subida por el
  administrador quedaba invisible.
- **Los campos nuevos del hero se habrían borrado solos**: el esquema Zod del
  editor descarta claves no declaradas, así que cada guardado desde el panel
  los eliminaba en silencio.
- **Consentimiento de marketing a medio cablear** (dejaba la base con un
  `NOT NULL` roto y 2 errores de TypeScript): `marketingConsentValue` se
  calculaba pero los tres puntos de escritura usaban el valor crudo.
- **`normalizedContact` calculado y nunca usado**: los campos desactivados en
  configuración se guardaban igual, así que un cliente manipulado podía
  escribir en campos que el comercio tenía apagados.
- **`claimCouponRedemption` sin conectar**: el reclamo atómico estaba escrito
  y probado, pero el pedido insertaba el canje directo — dos pedidos
  simultáneos podían pasarse ambos del cupo del cupón.
- **El webhook exigía consentimiento de *analítica* para enviar a Meta**,
  cuando Meta es marketing.
- **Teléfono de ejemplo publicado** (`573000000000`) en el pie de la ficha.
- **Prueba de integración con lista de migraciones desactualizada**, que
  ocultaba el desajuste del esquema.

## Riesgos y limitaciones

- **La tienda no tiene fotografías reales.** 7 de 8 productos usan la misma
  imagen de ejemplo. Ninguna mejora de conversión de esta ronda compensa no
  poder comparar tonos. Es el pendiente más importante — ver
  `docs/CONTENT_REQUIRED.md`.
- **Meta está implementado pero apagado.** Sin `META_PIXEL_ID` ni token no se
  envía nada. Es deliberado: el sistema no finge envíos exitosos.
- **No se enviaron eventos reales a Meta** en ningún momento.
- **No se verificó el píxel cargando de verdad**, porque no hay credenciales.
  Lo verificado en navegador es el caso negativo: sin consentimiento no hay
  `fbq`, ni script, ni cookies de Meta.
- **No se pudieron tomar capturas de pantalla**: la sesión no tenía el panel
  del navegador visible. La verificación se hizo con inspección textual del
  DOM y del árbol de accesibilidad, que para comprobar textos y estructura es
  más fiable, pero **no sustituye una revisión visual humana**.
- **Sin sesión de administrador en el navegador**: la política de la
  herramienta impide escribir contraseñas. Los cambios del panel
  (`/admin/editor`, `/admin/configuracion`) se verificaron por tipos, lint,
  build y pruebas, no con una sesión real.
- **`checkout`, `carrito` y el catálogo quedaron sin rediseñar** — ver
  "Qué falta" abajo.

## Qué falta probar con tráfico real

Nada de esta ronda demuestra que la conversión suba. Lo que se puede afirmar
es que la tienda ya responde antes del clic las preguntas que antes obligaban
a escribir. Para saber si funciona:

1. **No reemplaces la campaña de golpe.** Ver "Próxima acción recomendada".
2. Mide durante al menos dos semanas o 200 conversaciones.

## KPIs a medir

| KPI | Base actual | Cómo leerlo |
| --- | --- | --- |
| Conversación → venta | 3,62 % | El objetivo declarado es 5–6 % |
| Conversaciones de baja calidad | 244 de 304 (80 %) | **El indicador más directo de esta ronda**: si el hero y la ficha hacen su trabajo, debe bajar |
| Contactos fuera de cobertura | 10 | Debe bajar con la promesa acotada por zona |
| Costo publicitario por venta | $30.445 | Consecuencia de los anteriores |
| Tasa de "agregar al carrito" | sin datos previos | Ahora medible vía `AddToCart` |
| Checkout iniciado → compra | sin datos previos | Ahora medible vía `InitiateCheckout` → `Purchase` |
| Compras atribuidas a campaña | sin datos previos | `orders.utm_campaign` en `/admin/analitica` |

Ojo con el sesgo: si bajan las conversaciones totales pero sube el porcentaje
de venta, **eso es el objetivo cumplido**, no una caída de demanda. El
propósito explícito era filtrar baja intención antes de WhatsApp.

## Verificación técnica

- `typecheck`, `lint`: limpios (0 errores, 0 avisos).
- `test`: 135/135 en 22 archivos (11 pruebas nuevas).
- `build` (Next) y `cf:build` (Cloudflare/OpenNext): correctos.
- `security:secrets`: 0 secretos en 478 archivos.
- Verificado en navegador a 1280 px y 360 px: sin desplazamiento horizontal.

### Incidencia de entorno resuelta

`cf:build` fallaba con "Acceso denegado" al leer directorios dentro de
`node_modules/.pnpm/`. Causa: **`node_modules` estaba instalado con pnpm**
aunque el proyecto declara npm (`package-lock.json` es el lockfile
versionado). OpenNext no puede recorrer la estructura de enlaces de pnpm en
Windows. Se reinstaló con `npm ci` y el build de Cloudflare volvió a pasar.

**Quedan en el repositorio `pnpm-lock.yaml` y `pnpm-workspace.yaml` sin
versionar.** No se borraron por no ser una decisión propia, pero si alguien
vuelve a ejecutar `pnpm install`, el build de Cloudflare se rompe otra vez.
Recomendación: eliminarlos.
