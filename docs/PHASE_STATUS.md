# PHASE_STATUS

## Estado

**Fase 4.1 implementada técnicamente en `fase-4-codex`, pendiente de las tres
validaciones manuales finales y de la aprobación expresa del propietario.**
Continuación recibida desde `e6d2627`. No se ha hecho merge a `main`, despliegue, dominio,
creación de recursos Cloudflare ni activación de pagos o eventos reales.

## Entregado

- Simulador fotográfico bajo demanda con consentimiento explícito, procesamiento
  en navegador, MediaPipe Face Landmarker, fallback manual, selector de tono,
  antes/después, ajustes, eliminación y alta al carrito.
- Administración de texturas por producto con validación real de archivo,
  almacenamiento local/R2, parámetros visuales, revisión y auditoría.
- Política y retención configurables, consentimiento revocable y garantía
  técnica de que la foto del simulador no se sube ni se registra.
- Rate limiting persistente en checkout, consulta, comprobantes y Web Vitals;
  headers CSP/HSTS/COOP/Permissions-Policy, validación de uploads y revisión de
  secretos.
- Health público mínimo, estado administrativo protegido, logs JSON, revisión
  de integraciones sin exponer valores y captura técnica de Web Vitals.
- Exportación JSON de negocio sin credenciales/sesiones/binarios; backup SQLite
  con `integrity_check` y SHA-256; restauración segura con copia previa.
- Staging Cloudflare preparado con placeholders, D1/R2 separados y modo
  mantenimiento; alternativa Node/Docker con volúmenes y healthcheck.
- Migraciones `0005` y `0006`, pruebas unitarias/E2E, accesibilidad, responsive,
  Lighthouse, bundle analysis, smoke test y documentación final.

## Verificación local

- `typecheck`, `lint`, build Next y build Cloudflare: correctos.
- Vitest: 62/62 en 14 archivos. Playwright: 8/8 sobre base aislada.
- Axe WCAG 2.2 AA crítica/seria: 0 hallazgos en rutas principales.
- Responsive: sin overflow en storefront y rutas administrativas a 390×844,
  768×1024, 1366×768, 1440×900 y 1920×1080.
- Lighthouse local producción:
  - Inicio: Performance 90, Accessibility 100, Best Practices 100, SEO 100;
    LCP 3,3 s, TBT 190 ms, CLS 0.
  - Producto: 95/100/100/100; LCP 2,9 s, TBT 40 ms, CLS 0.
- `npm audit --omit=dev` reporta 4 avisos moderados en la cadena de Drizzle
  Kit/esbuild; la auditoría completa reporta 17 avisos (4 moderados y 13 altos)
  al añadir ESLint/minimatch y OpenNext/node-minify. npm no ofrece corrección
  compatible: solo retrocesos o saltos mayores; no se aplicó `--force`.

## Pendiente externo y humano

- Cloudflare: crear D1/R2/Worker de staging y validar preview remoto.
- Mercado Pago: credenciales sandbox y prueba oficial de preferencia/webhook.
- Meta: credenciales de prueba, consentimiento y autorización antes de un test
  event; no se enviaron eventos.
- SMTP: proveedor/credenciales y prueba de recuperación.
- Contenido: fotografías reales, datos legales, cuenta bancaria, contactos,
  textos comerciales y dominio definitivo.
- La salida a producción **no está aprobada**.
# Avance Fase 4.1 — panel administrativo completo (2026-07-29)

- Inventario, envíos, editor visual, analítica, integraciones, usuarios/roles, simulador, auditoría, configuración, estado y dashboard cuentan con controles persistentes.
- El shell administrativo incorpora navegación móvil, búsqueda real y sidebar colapsable; los estados y métodos visibles se traducen al español.
- Migraciones `0007` y `0008` agregan métodos de pago permitidos por regla y posición persistente del simulador.
- Productos cuentan con galería de carga directa y editor masivo sin límite funcional fijo en `/admin/productos/edicion-masiva`; el guardado se fragmenta en bloques de transporte.
- Los campos de imagen de categorías, promociones, pop-ups y configuración permiten cargar desde el equipo y usar el recurso inmediatamente.
- Pedidos y clientes incorporan limpieza total exclusiva del propietario, doble confirmación, auditoría y liberación de reservas.
- Las acciones de creación muestran nombres específicos y los vacíos explican qué ocurrirá o cuál es el siguiente paso.
- Matriz funcional y visual: `docs/PHASE_4_1_MATRIX.md`.
- Pendientes externos: credenciales y pruebas sandbox de Mercado Pago/Meta/SMTP; creación y comprobación de D1/R2/Worker; dominio y contenido legal definitivo.
- Estado de producción: **no aprobado**. La rama continúa aislada de `main`.

# Auditoría final — `fase-4-claude-review` (2026-07-29)

Auditoría funcional y visual de cierre sobre la base `d4081f6`, con
recorrido real en navegador (sesión propia con rol propietario) además de
lectura de código, y línea base completa antes y después de los cambios.

## Verificación local (repetida al final)

- `typecheck`, `lint`, build Next y build Cloudflare: correctos.
- Vitest: 62/62 en 14 archivos. Playwright: 8/8 sobre base aislada.
- Escaneo de secretos: 0 hallazgos en 361-362 archivos.
- `npm audit --omit=dev`: sigue en 4 avisos moderados de la cadena Drizzle
  Kit/esbuild (dependencia de desarrollo), sin cambios frente a la fase
  anterior; no se aplicó `--force`.

## Errores reales encontrados y corregidos

- `/admin/productos/edicion-masiva` fallaba con "Error en el panel" al
  cargar: una imagen de producto se guardó con un espacio final en la URL
  (bug en `detail-actions.ts`, no en los datos) y `next/image` la rechazaba.
  Corregido el parseo y el registro afectado en la base local.
- `/admin/estado` marcaba "Migraciones" y "Almacenamiento" como correctos
  de forma incondicional. Ahora ambos hacen una verificación real.
- Varios estados de pedido, pago, recompensas, pop-ups, cupones,
  promociones y contenido se mostraban en inglés crudo (`pending_payment`,
  `draft`, etc.) en vez de traducidos. Corregido en `status-labels.ts` y en
  los `recordTitle` de las pantallas afectadas.
- Componente `admin-module-placeholder.tsx` sin ningún uso: eliminado.

## Mejoras de UX/UI aplicadas

- Edición masiva de productos rediseñada como tabla compacta (encabezado y
  selección fijos, miniatura expandible) en vez de tarjetas verticales por
  producto.
- `/admin/pagos`, `/admin/pedidos` y `/admin/productos` — las últimas
  pantallas con tablas sin estilo ni estado vacío — ahora usan el mismo
  lenguaje visual que el resto del panel (filtros, badges, miniaturas,
  estados vacíos reales).
- El editor visual reemplaza el JSON crudo de cada bloque por campos
  guiados (texto, número, casilla, listas repetibles, selector de origen
  de colección), con un modo JSON avanzado opcional.
- Imágenes de producto unificadas a recorte cuadrado (1:1) en catálogo,
  tarjetas, ficha de producto y colecciones del home.

Detalle completo con rutas, hallazgos y pendientes: `docs/PHASE_4_1_MATRIX.md`.

## Pendiente

- Todo lo listado como pendiente externo/humano arriba sigue igual: no se
  crearon recursos Cloudflare, no se probaron credenciales de Mercado
  Pago/Meta/SMTP, no hay contenido ni dominio definitivo.
- Galería de imágenes múltiples en la ficha de producto pública (hoy solo
  se muestra la portada) y traducción completa de nombres de entidad en
  `/admin/auditoria` quedan como mejoras futuras, no como bloqueos.
- Esta auditoría **no aprueba producción, no hace merge y no constituye
  autorización para desplegar**. Queda pendiente de revisión humana.

# Ronda 2 — diez mejoras solicitadas (2026-07-30)

Diez pedidos puntuales del propietario sobre `fase-4-claude-review`
(`d4081f6` en adelante), cada uno implementado, verificado en navegador con
datos reales y confirmado contra la base de datos, con commits propios.

## Cambios entregados

- **Multimedia:** carga múltiple de archivos en un solo envío, nombre de
  archivo original conservado (con sufijo solo si hay colisión), miniaturas
  cuadradas y eliminación sin exigir un motivo obligatorio.
- **Carga instantánea de imágenes:** el editor individual y masivo de
  productos, y los pop-ups, suben el archivo apenas se selecciona (sin botón
  "Subir" aparte); se corrigió además el panel "Más detalles" del editor
  masivo, que se rompía visualmente por vivir dentro de una tabla con scroll
  horizontal.
- **Recompensas — envío gratis por zona:** `reward_rules.eligible_zone_ids`
  (migración `0010`) permite restringir una recompensa de envío gratis a
  ciudades/departamentos concretos desde `/admin/recompensas`; el motor de
  recompensas solo la desbloquea si el destino coincide, evaluado tanto en
  checkout (cliente) como en la creación de pedido (servidor, autoritativo).
- **Productos — límite por categoría en el carrito:** un producto puede
  configurarse con un máximo de unidades permitidas por cada unidad de una
  categoría elegida presente en el carrito (`products.limit_category_id` y
  `max_units_per_category_unit`, migración `0009`); se aplica al agregar y al
  cambiar cantidad, en cliente y servidor.
- **Inventario:** nueva herramienta de ajuste masivo (motivo + delta por
  fila) y vista principal compactada, siguiendo el mismo patrón visual que
  la edición masiva de productos.
- **Pop-ups:** no existía ningún componente que los mostrara en la tienda;
  se construyó el disparador (retraso, scroll, intención de salida,
  frecuencia por sesión/período) y se corrigió `includedPaths` para que
  comparar contra una URL completa no impidiera nunca la coincidencia.
- **Envíos — barrios de Medellín:** la lista de barrios del checkout ahora
  se lee de las zonas de nivel "Barrio" configuradas en `/admin/envios`
  (con tarifa propia opcional), en vez de una lista fija en código.
- **Editor visual — arrastrar y soltar:** cada bloque tiene un asa de
  arrastre (⠿) para reordenar con una guía visual de destino, persistido en
  un solo viaje al servidor (`reorderBlocksAction`); los botones ↑/↓ se
  conservan como alternativa accesible sin mouse/touch.
- **Configuración:** los tres formularios de guardado (marca, transferencia
  manual, privacidad) ahora usan `useActionState` y muestran una
  confirmación visible; antes guardaban sin ningún indicio en pantalla.
- **Zonas de peligro:** "Limpiar todos los pedidos/clientes" vive ahora
  detrás de un `<details>` colapsado por defecto, en vez de ocupar espacio
  permanente en la pantalla.

## Verificación local (repetida al final de la ronda)

- `typecheck`, `lint`, build Next y build Cloudflare (`cf:build`): correctos.
- Vitest: 65/65 en 14 archivos. Playwright: 8/8 sobre base aislada (se
  ajustó un E2E para abrir primero la zona de peligro, ahora colapsada).
- Escaneo de secretos: 0 hallazgos en 369 archivos.
- `npm audit`: sin cambios frente a las fases anteriores (4 avisos
  moderados de la cadena Drizzle Kit/esbuild, 17 en total con ESLint/
  minimatch y OpenNext/node-minify; todas son dependencias de build/dev,
  ninguna corrección disponible sin salto de versión mayor).
- Cada cambio se probó manualmente en navegador con datos reales (subida de
  archivos, pedido completo a Medellín vs. Bogotá para envío por zona,
  arrastrar bloques y recargar para confirmar persistencia, etc.) y los
  datos de prueba se limpiaron de la base local al terminar.

## Pendiente

- `PROJECT_MAP.md` es generado automáticamente ("no editar a mano"); no se
  modificó a mano en esta ronda.
- Todo lo ya listado como pendiente externo/humano en las secciones
  anteriores sigue igual.
- Esta ronda **no aprueba producción, no hace merge y no constituye
  autorización para desplegar**. Queda pendiente de revisión humana.

# Grupos de barrios con tarifa propia (2026-07-30)

Pedido puntual del propietario: la lista de barrios del checkout debía
poder editarse (agregar/quitar), agruparse con una tarifa compartida o
individual, y permitir marcar barrios sin cobertura — con una interfaz de
pastillas donde se pegan varios barrios separados por coma a la vez.

## Diseño

- Una zona de nivel "Barrio" ahora puede representar un **grupo** de uno o
  más barrios (`shipping_zones.neighborhood_names`, migración `0011`), en
  vez de un solo nombre por fila. Los barrios existentes se migraron
  automáticamente como grupos de un solo barrio.
- Cada ciudad tiene dos grupos reservados, creados bajo demanda: **Sin
  grupo** (barrios entregables sin tarifa propia; usan la tarifa general de
  la ciudad) y **Sin cobertura** (barrios sin servicio; su regla tiene
  `blocks_delivery = true` y hace que el checkout responda "sin tarifa
  disponible" en vez de heredar la tarifa de un nivel más amplio).
- `/admin/envios` tiene un tablero nuevo por ciudad con pestañas = grupos;
  cada pestaña integra nombre, tarifa/tiempos/mensaje y las pastillas de
  barrios, con una caja para pegar varios a la vez ("Guayabal, Castropol")
  y arrastre de pastillas entre pestañas para mover un barrio de grupo.
- El checkout deja de usar la lista fija `MEDELLIN_NEIGHBORHOODS`: si la
  ciudad tiene barrios configurados se ofrece el desplegable real; si no
  tiene ninguno, el campo de texto libre ahora es **obligatorio** (antes
  era opcional) para cualquier ciudad, no solo Medellín.
- Se corrigió un bug preexistente al implementar esto: el formulario de
  checkout mezclaba el atributo nativo `required` de HTML con mensajes de
  error personalizados en español; el navegador bloqueaba el envío antes
  de que el JS pudiera mostrar su propio mensaje. Se agregó `noValidate`
  al formulario para que el mensaje en español sea siempre el que se ve.

## Verificación

- `typecheck`, `lint`, build Next y build Cloudflare: correctos.
- Vitest: 70/70 (se agregaron pruebas de coincidencia por grupo y de
  bloqueo por "sin cobertura" en `shipping.test.ts`).
- Playwright: 12/12, incluida una prueba nueva de arrastrar-y-soltar real
  (`neighborhood-groups.spec.ts`) que crea un grupo, pega barrios, fija
  tarifa, la verifica en un pedido real, confirma que "sin cobertura" no
  aparece como opción y que una ciudad sin barrios exige el campo de texto.
- Verificado además en uso real: el propietario creó un grupo con 224
  barrios reales de Medellín y le asignó tarifa desde el panel durante
  esta misma sesión de trabajo.

## Pendiente

- Esta funcionalidad **no aprueba producción, no hace merge y no
  constituye autorización para desplegar**. Queda pendiente de revisión
  humana.
