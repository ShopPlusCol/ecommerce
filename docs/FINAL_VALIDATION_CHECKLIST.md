# Validación final antes de lanzar — ShopPlusCol

Guía para hacer clic por clic. **No hace falta saber programar.** Solo dos
comandos, y luego todo es usar la tienda como lo haría una clienta.

> **Nada de lo que hagas aquí es real.** Los pedidos se crean en una base de
> datos aparte, con el número marcado `TEST-`, y se pueden borrar de golpe al
> terminar. Mercado Pago está forzado a modo de prueba.

---

## Paso 0 — Arrancar el entorno de pruebas

Abre una terminal en la carpeta del proyecto y ejecuta, **una sola vez**:

```bash
npm run staging:seed
```

Después, cada vez que quieras validar:

```bash
npm run staging
```

Verás algo así:

```
[staging] ENTORNO DE PRUEBAS en http://localhost:3300
[staging] Mercado Pago forzado a modo de prueba. Los pedidos llevarán prefijo TEST-.
```

- **Tienda:** http://localhost:3300
- **Panel:** http://localhost:3300/acceso-admin

**Cómo saber que estás en pruebas y no en la tienda real:** al entrar al
panel, arriba del todo hay una franja amarilla que dice **ENTORNO DE
PRUEBAS**. Si no la ves, **detente** y avisa: podrías estar en la tienda real.

Para apagarlo: `Ctrl + C` en la terminal.

Al terminar toda la validación, para borrar lo que creaste:

```bash
npm run staging:clean
```

(Añade `--dry-run` al final si primero quieres ver qué borraría sin borrarlo.)

---

## Cómo usar esta guía

Cada prueba tiene una tabla. Rellena **Resultado obtenido**, marca
**Aprobado** y, si algo falla, guarda una captura.

**Si algo falla, comparte:** la captura de pantalla, en qué paso ocurrió, y
qué dispositivo/navegador usabas.

---

## Prueba A — Contenido comercial

Abre http://localhost:3300 y revisa la portada y una ficha de producto.

| # | Qué revisar | Resultado esperado | Resultado obtenido | Aprobado | Evidencia | Error |
|---|---|---|---|---|---|---|
| A1 | Precio en la portada | Se ve "Lentes + estuche desde $49.000" en el primer pantallazo, sin bajar | | ☐ | | |
| A2 | Qué incluye | Dice "Incluye: par de lentes + estuche sencillo" | | ☐ | | |
| A3 | Líquido | Dice claramente "No incluye: líquido ni domicilio" | | ☐ | | |
| A4 | Domicilio | Queda claro que el domicilio se cobra aparte | | ☐ | | |
| A5 | Cobertura | La entrega el mismo día aparece **solo** para las ciudades configuradas y con su aclaración. Si ya pasó la hora límite, **no debe aparecer** | | ☐ | | |
| A6 | Fotografías | Las fotos de ejemplo salen etiquetadas "Foto de ejemplo". **Hoy son 7 de 8 productos** | | ☐ | | |
| A7 | **Alaska Gris** | Abre `/admin/productos` → Alaska Gris. Su URL es `/productos/21` y está en la familia **Verde** aunque se llame **Gris**. **Decide tú:** ¿el tono es verde o gris? Corrige el que esté mal | | ☐ | | |
| A8 | Promociones | Solo Oslo muestra descuento (−17%, antes $59.000). Confirma que ese precio anterior existió de verdad | | ☐ | | |
| A9 | Testimonios | En la portada **no** deben verse testimonios publicados como reales | | ☐ | | |

> A6, A7 y A9 no impiden probar el flujo técnico. Son contenido que debes
> aportar o confirmar antes de lanzar. Lista completa en
> `docs/CONTENT_REQUIRED.md`.

---

## Prueba B — Compra contraentrega (la más importante)

| # | Paso | Resultado esperado | Resultado obtenido | Aprobado | Evidencia | Error |
|---|---|---|---|---|---|---|
| B1 | Abre esta URL exacta:<br>`http://localhost:3300/?utm_source=facebook&utm_medium=cpc&utm_campaign=prueba_validacion&utm_content=anuncio1` | Carga la portada con normalidad | | ☐ | | |
| B2 | En el aviso de privacidad pulsa **Aceptar todas** | El aviso desaparece y no vuelve a salir | | ☐ | | |
| B3 | Abre un producto (por ejemplo Amazon Brown) | Se ve precio, qué incluye y qué no | | ☐ | | |
| B4 | Pulsa **Agregar al carrito** | El botón se convierte en − 1 + y el carrito marca 1 | | ☐ | | |
| B5 | Abre el carrito y pulsa **Continuar al pago** | Llegas al checkout | | ☐ | | |
| B6 | Departamento: **Antioquia**. Ciudad: **Medellín** | Aparece el campo de barrio | | ☐ | | |
| B7 | Escribe en Barrio y elige uno de la lista | Se selecciona sin problemas | | ☐ | | |
| B8 | Mira el envío | Muestra una tarifa concreta, **no** "por calcular" | | ☐ | | |
| B9 | Elige **Pago contra entrega** | Se marca la opción | | ☐ | | |
| B10 | Revisa el resumen | Se ve claro **cuánto pagas ahora** y **cuánto al recibir** | | ☐ | | |
| B11 | Rellena nombre, teléfono y dirección, y pulsa **Confirmar pedido** | Llegas a la confirmación con un número que **empieza por TEST-** | | ☐ | | |
| B12 | Entra al panel → **Pedidos** | El pedido aparece, con el prefijo TEST- | | ☐ | | |
| B13 | Abre el pedido | Los totales coinciden con lo que viste en el checkout | | ☐ | | |
| B14 | En el pedido, busca la campaña | Debe aparecer `prueba_validacion` como campaña de origen | | ☐ | | |

> B14 es la prueba de que la atribución funciona: si no aparece la campaña,
> no podrás saber qué anuncio genera cada venta.

---

## Prueba C — Zona sin cobertura

| # | Paso | Resultado esperado | Resultado obtenido | Aprobado | Evidencia | Error |
|---|---|---|---|---|---|---|
| C1 | En el checkout, elige un departamento sin tarifa (por ejemplo **Amazonas**) | | | ☐ | | |
| C2 | Mira el envío | **No inventa una tarifa.** Muestra un mensaje explicando que no hay cobertura | | ☐ | | |
| C3 | Intenta confirmar | El botón **no** permite completar el pedido | | ☐ | | |
| C4 | Lee el mensaje | Se entiende sin ser técnico | | ☐ | | |

---

## Prueba D — WhatsApp

**No envíes los mensajes** si el número configurado es el real. Basta con ver
el texto que se abre en WhatsApp.

| # | Paso | Resultado esperado | Resultado obtenido | Aprobado | Evidencia | Error |
|---|---|---|---|---|---|---|
| D1 | En una ficha, pulsa **Comprar este tono por WhatsApp** | El mensaje trae nombre del producto, cantidad y precio | | ☐ | | |
| D2 | Revisa ese mismo mensaje | Menciona qué incluye y que el domicilio va aparte, y deja un hueco para la ubicación | | ☐ | | |
| D3 | Con productos en el carrito, pulsa **Finalizar por WhatsApp** | Lista los productos con cantidades y el total | | ☐ | | |
| D4 | Botón verde flotante | Abre WhatsApp con un mensaje general | | ☐ | | |
| D5 | En móvil, revisa el botón flotante | **No tapa** ningún botón de comprar ni de confirmar | | ☐ | | |

---

## Prueba E — Mercado Pago (solo credenciales de prueba)

Requiere haber puesto en `.env.staging` el Access Token de **prueba** (empieza
por `TEST-`). Si no lo tienes configurado, salta esta prueba.

| # | Paso | Resultado esperado | Resultado obtenido | Aprobado | Evidencia | Error |
|---|---|---|---|---|---|---|
| E1 | Haz un pedido eligiendo **Mercado Pago** | Te redirige a Mercado Pago | | ☐ | | |
| E2 | Paga con una **tarjeta de prueba** de Mercado Pago | El pago se aprueba | | ☐ | | |
| E3 | Vuelve al panel → Pedidos | El pedido figura como pagado | | ☐ | | |
| E4 | Revisa el inventario del producto | Bajó la cantidad correspondiente | | ☐ | | |
| E5 | Recarga la página de confirmación varias veces | **No** se crea un segundo pedido ni un segundo pago | | ☐ | | |

> Nunca uses una tarjeta real. Las tarjetas de prueba están en la
> documentación de Mercado Pago, sección "Tarjetas de prueba".

---

## Prueba F — Meta (Eventos de prueba)

Requiere configurar Meta primero (ver más abajo, "Configurar Meta"). Ten
abierto **Events Manager → Probar eventos** en otra pestaña.

| # | Paso | Resultado esperado | Resultado obtenido | Aprobado | Evidencia | Error |
|---|---|---|---|---|---|---|
| F0 | Abre la tienda **sin** aceptar el aviso de privacidad | En Meta **no** aparece ningún evento | | ☐ | | |
| F1 | Pulsa **Aceptar todas** | Aparece **un solo** `PageView`, no dos | | ☐ | | |
| F2 | Abre un producto | Aparece `ViewContent` | | ☐ | | |
| F3 | Agrégalo al carrito | Aparece `AddToCart` | | ☐ | | |
| F4 | Entra al checkout | Aparece `InitiateCheckout` | | ☐ | | |
| F5 | Elige un método de pago | Aparece `AddPaymentInfo` | | ☐ | | |
| F6 | Pulsa un botón de WhatsApp | Aparece `Contact` | | ☐ | | |
| F7 | Confirma un pedido contraentrega | Aparece **un solo** `Purchase` | | ☐ | | |
| F8 | Recarga la confirmación 3 veces | **Sigue habiendo un solo** `Purchase` | | ☐ | | |
| F9 | Mira cualquier evento en Meta | Debe figurar como recibido por **navegador y servidor a la vez** (deduplicado), no como dos eventos | | ☐ | | |

> F8 y F9 son las importantes. Un `Purchase` duplicado hace que el costo por
> venta que ves en Meta sea falso.

---

## Prueba G — Dispositivos

Con el celular en la misma red WiFi, entra a la dirección que muestra la
terminal en "Network" (por ejemplo `http://192.168.1.4:3300`).

| # | Dispositivo / navegador | Qué revisar | Resultado obtenido | Aprobado | Evidencia | Error |
|---|---|---|---|---|---|---|
| G1 | Android · Chrome | La portada se ve completa, sin cortes | | ☐ | | |
| G2 | Android · Chrome | **No hay barra de desplazamiento horizontal** (la página no se mueve de lado) | | ☐ | | |
| G3 | Android · Chrome | En el checkout, el aviso de cookies **no tapa** el botón de confirmar | | ☐ | | |
| G4 | Android · Chrome | El botón de WhatsApp **no tapa** ningún botón | | ☐ | | |
| G5 | iPhone · Safari (si tienes) | Lo mismo que G1-G4 | | ☐ | | |
| G6 | Brave (móvil o escritorio) | La tienda funciona con el bloqueador activo | | ☐ | | |
| G7 | Computador · Chrome | Se ve bien y sin espacios vacíos exagerados | | ☐ | | |
| G8 | Celular pequeño (360 px) | Todo legible, botones cómodos de pulsar | | ☐ | | |

---

## Configurar Meta (una sola vez)

**No pegues ningún token en un chat.** Se escriben directamente en el archivo.

1. Entra a **Meta Events Manager** → tu píxel → **Configuración**.
2. Copia el **ID del píxel**.
3. En la misma pantalla, genera un **token de acceso de la API de
   Conversiones**.
4. Ve a **Probar eventos** y copia el **código de eventos de prueba** (algo
   como `TEST12345`).
5. En la carpeta del proyecto, copia `.env.staging.example` a `.env.staging` y
   rellena:
   - `META_PIXEL_ID`
   - `META_CONVERSIONS_ACCESS_TOKEN`
   - `META_TEST_EVENT_CODE`
6. Reinicia con `npm run staging`.
7. Entra al panel → **Integraciones** → "Meta Pixel y Conversions API" →
   marca **Integración activa** y **Modo de prueba** → **Guardar estado**.

> Si `META_TEST_EVENT_CODE` está vacío, los eventos se cuentan como
> **reales** y ensucian el aprendizaje de tus campañas. El comando
> `npm run staging` avisa si detecta ese caso.

### Si una compra no llega a Meta

Puede pasar si Meta tiene una caída. La compra **no se pierde**: queda
guardada y pendiente.

Panel → **Integraciones** → "Meta Pixel y Conversions API" → botón
**Reintentar compras pendientes**. Se puede pulsar varias veces sin riesgo:
no duplica compras ya enviadas.

---

## Al terminar

1. Anota en esta guía qué falló.
2. Borra los datos de prueba: `npm run staging:clean`
3. Revisa `docs/CONTENT_REQUIRED.md` y decide sobre el contenido pendiente.

**La tienda no debe salir a producción hasta que:**

- [ ] Todas las pruebas B, C, D y F estén aprobadas.
- [ ] Alaska Gris esté corregido (A7).
- [ ] Los productos tengan fotografías reales, o hayas decidido lanzar
      sabiendo que se ven con foto de ejemplo (A6).
- [ ] Los testimonios sean reales y estén marcados como verificados, o la
      sección siga oculta (A9).
