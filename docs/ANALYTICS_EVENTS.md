# ANALYTICS_EVENTS.md — Eventos de conversión (Meta Pixel + Conversions API)

Estado: **implementado y desactivado**. El código está completo y probado;
la integración permanece apagada hasta que existan credenciales reales. Sin
ellas no se carga el píxel, no se envía nada y **no se simula ningún envío
exitoso**.

## Cómo activarlo

1. En Meta Events Manager: Orígenes de datos → tu píxel → Configuración.
2. Variables de entorno (local: `.env.local`; desplegado: Cloudflare →
   Settings → Variables and Secrets):

   | Variable | Tipo | Obligatoria |
   | --- | --- | --- |
   | `META_PIXEL_ID` | Texto (público) | Sí |
   | `META_CONVERSIONS_ACCESS_TOKEN` | **Secret** | Sí, para eventos de servidor |
   | `META_GRAPH_API_VERSION` | Texto | No (por defecto `v21.0`) |
   | `META_TEST_EVENT_CODE` | Texto | No — solo para probar |

3. Activar la integración en `/admin/integraciones` → "Meta Pixel y
   Conversions API". **El panel manda**: aunque las variables existan, si la
   integración está inactiva no se envía nada.

El token nunca sale del servidor: no forma parte del tipo `PublicMetaConfig`
que llega al navegador, y viaja en el cuerpo de la petición a Meta (no en la
URL) para no quedar en logs de intermediarios.

## Consentimiento

| Categoría | Qué habilita |
| --- | --- |
| Necesario | Carrito y sesión. Siempre activo, nunca es marketing. |
| Analítica | Registro interno de eventos (buffer de diagnóstico). |
| **Marketing** | **Meta Pixel y Conversions API.** |

Sin consentimiento de marketing el script de Meta **nunca se inyecta** en la
página — no se carga "apagado" ni se usa `fbq('consent','revoke')` como
sustituto. Verificado en navegador: sin aceptar no existe `window.fbq`, ni el
script, ni cookies de Meta.

La decisión se guarda en `localStorage` y en la cookie
`shoppluscol_consent`. La cookie existe porque el servidor tiene que poder
comprobarla: la server action de reenvío es un endpoint público y vuelve a
exigir el consentimiento por su cuenta, sin fiarse del cliente.

## PageView: una sola fuente

`MetaPixel` **solo inicializa** el píxel; no emite ninguna vista.
`PageViewTracker` es la única fuente de `PageView`, y emite con `event_id`
para que píxel y Conversions API se deduplican.

Antes ambos emitían: cada carga contaba dos veces y el del píxel salía sin
`event_id`, así que ni siquiera podía deduplicarse. La decisión vive en
`shouldEmitPageView` (pura, con pruebas):

| Situación | Comportamiento |
| --- | --- |
| Antes de decidir | No se emite nada |
| Rechaza todo | No se emite nada |
| Acepta solo marketing | Se emite (antes no: el efecto dependía de `analytics`) |
| Acepta todas | Una sola vista |
| Preferencia ya guardada, al hidratar | Una sola vista, no dos |
| Cambio de ruta | Una vista por navegación |
| Acepta marketing estando ya en la página | Se reemite una vez, para que Meta reciba esa vista |

`MetaPixel` se monta **antes** que `PageViewTracker` en el árbol: los
efectos de hermanos corren en orden de montaje, y el tracker necesita que
`window.fbq` exista cuando emite la primera vista.

## Deduplicación

Cada acción genera **un solo `event_id`** que se envía por las dos vías (el
píxel del navegador y la Conversions API). Meta las une en una sola
conversión en lugar de contarlas dos veces.

## Purchase: bandeja de salida con reintentos

Una compra duplicada distorsiona el costo por venta; una compra perdida
distorsiona el ROAS. `analytics_events` funciona como bandeja de salida
(migración `0020`):

| Columna | Para qué |
| --- | --- |
| `delivery_status` | `pending` / `sent` / `failed` |
| `attempts` | Intentos realizados |
| `last_attempt_at` | Último intento |
| `next_retry_at` | Desde cuándo se puede reclamar el reintento |
| `last_error_code` | Motivo saneado (código, nunca el cuerpo de la respuesta) |

El reclamo es atómico por dos vías:

- El **INSERT** choca con el índice único de `event_id`: solo uno entra, y
  nace con `next_retry_at` en el futuro, así que el webhook concurrente que
  pierde tampoco puede reclamarlo como reintento.
- El **UPDATE** de reclamo exige `delivery_status <> 'sent'` y que el
  reintento haya vencido, y desplaza `next_retry_at` en la misma sentencia.

Antes bastaba con que la fila existiera para dar la compra por despachada:
si Meta fallaba, **la compra se perdía para siempre** porque el reintento
veía la fila y se retiraba.

Espera exponencial: 1, 2, 4… minutos, con techo de una hora y un máximo de
8 intentos.

### Recuperar compras pendientes

```
recoverPendingPurchaseEvents({ limit: 50 })
```

Reintenta las compras no entregadas cuyo reintento ya venció. Es segura de
ejecutar en paralelo (cada evento se vuelve a reclamar atómicamente).

**No hay planificador en la arquitectura, así que no se ejecuta sola.** Es
una decisión consciente, no un olvido: añadir un cron a Cloudflare Workers
requiere configuración de despliegue que está fuera del alcance de esta
ronda. Mientras tanto, se invoca a mano cuando Meta haya tenido una caída.

## Protección del endpoint de reenvío

`forwardConversionEventAction` es una **server action**, es decir un
endpoint público invocable desde fuera de la tienda. Aplica, en orden:

1. Consentimiento de marketing comprobado en servidor (cookie), no en el
   cliente.
2. Origen acotado: la `eventSourceUrl` debe pertenecer al dominio
   configurado o al de la propia petición. Sin esto se podían atribuir
   eventos desde cualquier dominio.
3. Límite de tasa por IP (hasheada, nunca almacenada en claro) y **un solo
   uso por `event_id`**, para que no se pueda repetir una conversión.
4. Esquema **estricto por tipo de evento**: una clave de más rechaza el
   evento en vez de descartarse en silencio.
5. **El importe lo calcula el servidor** desde el catálogo. El navegador ya
   no manda `value`: de él dependen el ROAS y el aprendizaje de las
   campañas, así que no puede venir de un número inventable.
6. No se acepta texto libre (el término buscado no viaja), ni se registran
   IP, payload ni el cuerpo de la respuesta de Meta.

## Tabla de eventos

| Evento | Cuándo | Origen | Datos | Consentimiento | Dedup | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| `PageView` | Carga inicial y cada cambio de ruta | Navegador + servidor | ruta | Marketing | `event_id` | Implementado |
| `ViewContent` | Al montar la ficha de producto | Navegador + servidor | `content_ids`, valor, COP | Marketing | `event_id` | Implementado |
| `Search` | Al ejecutar una búsqueda con término | Navegador + servidor | término, nº de resultados | Marketing | `event_id`, una vez por término | Implementado |
| `AddToWishlist` | Al marcar favorito | Navegador + servidor | `content_ids` | Marketing | `event_id` | Implementado |
| `AddToCart` | Al agregar (tarjeta o ficha) | Navegador + servidor | `content_ids`, valor, cantidad | Marketing | `event_id`, uno por acción | Implementado |
| `InitiateCheckout` | Al entrar realmente al checkout | Navegador + servidor | valor del carrito | Marketing | `event_id` | Implementado |
| `AddPaymentInfo` | Al elegir método de pago explícitamente | Navegador + servidor | método | Marketing | `event_id` | Implementado |
| `Contact` | Clic en WhatsApp (flotante, ficha, carrito) | Navegador + servidor | origen, valor si aplica | Marketing | `event_id` | Implementado |
| `Purchase` | **Solo servidor**, al confirmarse el pedido | Servidor | valor, `order_id`, UTM, correo/teléfono hasheados | Marketing (el registrado con el pedido) | `purchase:<orderId>` + índice único | Implementado |

### Por qué `Purchase` no sale del navegador

Se emite en dos puntos, mutuamente excluyentes:

- **Contra entrega u otro método sin pago pendiente**: al crear el pedido,
  cuando queda `confirmed`.
- **Mercado Pago**: en el webhook, al aprobarse el pago.

El navegador nunca puede dispararlo — está excluido de la lista de eventos
reenviables de la server action. Si se aceptara, bastaría recargar la página
de confirmación para inflar las compras.

El `event_id` se ancla al **pedido**, no al pago: un pedido con dos pagos
(reintento, pago parcial) sigue siendo una sola compra.

## Datos personales

- Correo y teléfono se envían **hasheados con SHA-256**, nunca en claro.
- El teléfono se normaliza a E.164 sin `+` antes de hashear (un número
  colombiano de 10 dígitos recibe el prefijo `57`), porque un hash de un
  formato distinto no empareja con nada.
- IP, user-agent y las cookies `_fbc`/`_fbp` van sin hashear: Meta los
  espera así y son señales de la propia petición.
- Los errores registrados guardan solo el código de estado, nunca el cuerpo
  de la respuesta de Meta (puede repetir parámetros enviados).

## Atribución UTM

`UtmAttribution` captura `utm_source`, `utm_medium`, `utm_campaign`,
`utm_content` y `utm_term` en dos cookies con 90 días de vida:

- `shoppluscol_utm_first` — **primera** fuente. No se sobrescribe nunca.
- `shoppluscol_utm_last` — última fuente. Se actualiza en cada visita con UTM.

Ambas se copian al pedido (`orders.utm_*`, `utm_first_attribution`,
`utm_last_attribution`) y aparecen en `/admin/analitica`, agrupadas por
fuente y campaña.

**Pendiente**: no se captura `fbclid` como parámetro propio. La cookie `_fbc`
sí se reenvía si el píxel la creó, pero eso requiere el píxel activo.

## Cómo probarlo

1. Configura `META_TEST_EVENT_CODE` con el código de "Eventos de prueba" de
   Events Manager y activa la integración.
2. Abre la tienda, **acepta marketing** en el aviso de privacidad.
3. En Events Manager → Eventos de prueba deberían aparecer `PageView` y, al
   navegar, `ViewContent` / `AddToCart`.
4. Comprueba en la columna de deduplicación que los eventos de navegador y
   servidor aparecen **unidos**, no duplicados.
5. Para `Purchase`, crea un pedido de prueba contra entrega. Recarga la
   confirmación varias veces: debe seguir habiendo **una sola** compra.

> No se enviaron eventos reales a Meta durante este trabajo: no hay
> credenciales configuradas y la integración está inactiva.

## Diagnóstico en el panel

`/admin/integraciones` muestra si las variables están presentes, si la
integración está activa y en qué modo, **sin exponer ningún valor**.

Las compras quedan registradas en `analytics_events` con su `event_id` y
`sent_to_server`, así que se puede verificar qué se envió y qué falló sin
depender de Meta.

**Pendiente**: no hay todavía una pantalla dedicada de "últimos eventos" en
el panel; hoy se consulta la tabla `analytics_events`.
