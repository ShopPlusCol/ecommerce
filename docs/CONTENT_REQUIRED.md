# CONTENT_REQUIRED.md — Contenido real pendiente

> Generado a partir de `node scripts/audit-content.mjs` sobre `.data/local.db`
> el 2026-08-04. Vuelve a ejecutarlo cuando cargues contenido: sale con
> código 1 mientras queden hallazgos de severidad alta, así sirve como
> control antes de publicar.

La tienda ya está construida para mostrar contenido real; lo que falta es el
contenido. **Ningún elemento de esta lista lo puede resolver el código**: son
decisiones y activos que solo tú puedes aportar. Mientras falten, la tienda
muestra respaldos honestos (marcadores identificables, secciones ocultas), no
contenido inventado.

> Estos avisos también aparecen **dentro del panel**, donde se trabaja:
> `/admin/productos` marca cada producto con "Sin imagen", "Foto de ejemplo"
> o "Imagen repetida", y `/admin/categorias` marca las categorías sin foto.
> En la tienda pública, una foto de ejemplo se muestra etiquetada como tal en
> la tarjeta del producto.

## 1. Fotografías de producto — 7 de 8 productos (severidad alta)

Siete productos se muestran hoy con una imagen de ejemplo. Peor: **la misma
imagen se repite en cinco lentes distintos**, así que el catálogo no permite
comparar tonos, que es justamente la decisión de compra.

| Producto | Imagen actual | Necesita |
| --- | --- | --- |
| Amazon Brown | `/demo/lentes-placeholder.svg` | Foto real del tono en ojo |
| Oslo | `/demo/lentes-placeholder.svg` | Foto real del tono en ojo |
| Boreal | `/demo/lentes-placeholder.svg` | Foto real del tono en ojo |
| Santorini | `/demo/lentes-placeholder.svg` | Foto real del tono en ojo |
| Crimson Eclipse | `/demo/lentes-placeholder.svg` | Foto real del tono en ojo |
| Solución multipropósito 120ml | `/demo/accesorio-placeholder.svg` | Foto del producto |
| Pinza y aplicador | `/demo/accesorio-placeholder.svg` | Foto del producto |

Solo **Alaska Gris** tiene una imagen propia cargada.

Recomendación por tono: una foto de ojo con luz neutra, una segunda con luz
cálida o de interior, y si es posible una en un iris oscuro y otra en uno
claro. Es lo que sostiene la frase "el resultado puede variar" sin que se
sienta una excusa.

**No se generaron imágenes de reemplazo a propósito**: una fotografía
inventada de un lente tergiversa el color real del producto, que es lo único
que la clienta está comprando.

## 2. Dos errores de datos que requieren tu confirmación (severidad alta)

Ambos son de **Alaska Gris** y no se corrigieron solos porque solo tú sabes
cuál es la respuesta correcta:

1. **Su URL es `/productos/21`.** El slug quedó como un número en vez de
   `alaska-gris`. Perjudica el SEO y deja un enlace poco creíble en un
   anuncio. *Corrección: editar el slug desde `/admin/productos`.*
   Si el producto ya recibió tráfico con esa URL, considera si necesitas una
   redirección.
2. **Se llama "Alaska Gris" pero está clasificado en la familia "Verde".**
   O el nombre o la familia está mal. Afecta a los filtros del catálogo y a
   la página `/categoria/gris`, donde hoy no aparece.
   *Corrección: editar la familia de color, o el nombre, desde
   `/admin/productos`.*

## 3. Fotografía del hero (severidad alta para conversión)

El hero admite una fotografía real desde el editor visual
(`/admin/editor` → bloque Portada → "Imagen"), con su texto alternativo. Sin
ella se muestra un marcador identificable.

Es el activo de mayor impacto de esta lista: es lo primero que ve alguien que
llega desde un anuncio. Ideal: primer plano de ojos con el tono puesto, buen
contraste, sin texto encima.

## 4. Imágenes de categoría (severidad media)

Las tres categorías (`Lentes de contacto`, `Accesorios`, `Halloween`) no
tienen fotografía propia y usan el respaldo genérico. Las tarjetas de
"Elige por tono" ganan mucho con un ojo real por tono en vez de un círculo de
color. *Se cargan desde `/admin/categorias`.*

## 5. Testimonios reales (severidad media)

Los tres testimonios actuales (Valentina R., Camila G., Mariana P.) son
**contenido de ejemplo** y hoy están marcados como no verificados, así que
**la sección completa no se publica en producción**. En desarrollo se ven con
la etiqueta "EJEMPLO · NO SE PUBLICA".

Para publicar testimonios reales: `/admin/editor` → bloque Testimonios →
marcar la casilla "Testimonio verificado" en cada uno. Marca esa casilla solo
si (a) la clienta existe y (b) autorizó que se publique su nombre.

Datos que admite cada testimonio: nombre abreviado, ciudad, texto, producto o
tono, y fecha.

## 6. Credenciales y datos que no son contenido

Pendientes de tu lado, sin los cuales la función queda correctamente
desactivada (no simulada):

- **Meta Pixel ID y token de Conversions API** — sin ellos no se carga el
  píxel ni se envía nada. Ver `docs/ANALYTICS_EVENTS.md`.
- **Mercado Pago producción** — hoy en modo prueba.
- **SMTP** — sin esto no salen los correos de confirmación.
- **Dominio definitivo** y `NEXT_PUBLIC_SITE_URL`.
- **Datos legales reales** en Términos, Privacidad y Devoluciones.

## 7. Decisiones de negocio pendientes

- La zona **"Resto de Colombia" sigue inactiva** (estado previo a esta
  ronda). Mientras siga así, ningún destino fuera de Antioquia recibe
  cotización de envío. Es una decisión tuya, no un error.
- Los 33 departamentos precargados **no tienen tarifa propia** salvo
  Antioquia.
- El descuento de **Oslo (−17%)** sí es real: tiene precio anterior $59.000
  configurado. Confirma que ese precio anterior existió de verdad.
