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

# Envíos y zonas: rearquitectura completa Departamento → Ciudad → Barrio (Ronda 3, 2026-07-30)

Pedido explícito del propietario: "grupos de barrios" (la ronda anterior) no
daba una jerarquía real ni herencia de configuración, y mezclaba
departamentos/ciudades/barrios en una sola pantalla. Se pidió rehacer por
completo el modelo de datos y la interfaz — "es casi como crear todo desde
0" — sin perder zonas, tarifas ni configuración existentes, y sin romper el
checkout, el carrito, los pagos ni el resto del panel.

## Diseño

- `shipping_zones` pasa de campos de texto sueltos (`department`/`city`/
  `neighborhood` comparados por igualdad) a un árbol real vía
  `parent_zone_id` (auto-referencia con `ON DELETE CASCADE`): Departamento
  (raíz) → Ciudad/Municipio → Barrio, más un nivel `country` sin padre como
  respaldo nacional ("Resto de Colombia").
- `shipping_rules` pasa de 1\:N por zona (reglas con fecha/prioridad) a
  **1:1 por zona**, con cada campo nullable: `null` = "hereda del ancestro
  más cercano que tenga un valor propio"; un valor no nulo = personalizado.
  Se retira la programación de tarifas por fecha (`starts_at`/`ends_at`/
  `priority`): no se encontraron datos reales que dependieran de ella.
- `resolveShippingQuote` (`src/domain/services/shipping.ts`) se reescribe
  por completo: encuentra la zona configurada más específica que coincide
  con el destino (profundizando solo mientras haya una zona hija que
  coincida), exige que la zona **y todos sus ancestros** estén activos y
  con cobertura disponible, y arma la configuración efectiva heredando cada
  campo del ancestro más cercano que lo tenga definido. El mismo motor lo
  usan el checkout, el simulador admin y el cálculo de recompensas por
  zona — nunca hay dos implementaciones que puedan divergir.
- `src/domain/services/business-time.ts` (nuevo) calcula si "mismo día"
  sigue disponible según la hora actual de `America/Bogota` contra la hora
  límite configurada; si ya pasó, el checkout usa los días hábiles
  configurados como respaldo.
- `/admin/envios` se reescribe como rutas anidadas con breadcrumbs
  (`/admin/envios` → `/[departamento]` → `/[departamento]/[ciudad]`) en vez
  de una sola pantalla; cada zona tiene un control Heredado/Personalizado
  por campo. Se retiran por completo el tablero de "grupos de barrios"
  (`neighborhood-groups-board.tsx` y sus acciones) y los casos
  `shippingZone`/`shippingRule` del sistema genérico de entidades — ya sin
  ningún formulario que los invocara.
- El checkout deja de usar la lista estática `colombia-locations.ts`.
  Departamento ahora muestra los 32 departamentos de Colombia + Bogotá D.C.
  (para que un cliente fuera de las zonas configuradas pueda seleccionar su
  ubicación real) más cualquier departamento configurado con un nombre
  distinto a esa lista; Ciudad/Municipio y Barrio se leen del árbol real y
  solo aparecen si el nivel superior tiene hijos configurados y activos.
  Los tres selectores son un combobox nuevo (`SearchableSelect`) con
  filtro de texto.

## Bugs reales encontrados y corregidos durante la verificación

- **`zone-actions.ts` exportaba una constante desde un archivo `"use
  server"`**, algo que Next.js prohíbe (solo permite exportar funciones
  async). Esto hacía que el componente de creación de zonas fallara en
  silencio dentro de un error boundary — ningún botón de "Agregar" hacía
  nada, sin mensaje visible. Se corrigió dejando de exportar la constante.
- **Eliminar un departamento o ciudad con hijos fallaba con "FOREIGN KEY
  constraint failed"** en vez de borrar en cascada. Causa raíz: la
  migración que agregó `parent_zone_id` (`0012`) lo hizo vía
  `ALTER TABLE ... ADD COLUMN`, y SQLite no aplica `ON DELETE CASCADE` en
  esa forma para una referencia a la propia tabla — aunque el esquema de
  Drizzle sí lo declaraba, la base real nunca lo tuvo. Se agregó la
  migración `0015` que reconstruye `shipping_zones` con la cláusula
  correcta. Encontrado por la prueba E2E nueva, no por revisión manual.

## Incidente: pérdida de datos en `.data/local.db` durante la verificación

Durante la verificación final, una comprobación por línea de comandos
mostró que `shipping_zones` había quedado con solo 2 filas (Antioquia y
Resto de Colombia) y `shipping_rules` con 0 — Medellín, Bello y los 213
barrios de Medellín con su tarifa habían desaparecido de la base de
desarrollo local. Se confirmó el mismo estado a través del panel real (no
era un espejismo de visibilidad de WAL entre procesos). No se identificó con certeza el mecanismo exacto que lo causó; el
sospechoso más plausible es el largo historial de manipulación directa de
esa misma base en rondas anteriores de esta sesión (backups, scripts
correctivos, migraciones a mano descritos más arriba en este documento),
no ninguna acción de esta ronda en particular.

**Se restauró** Medellín, Bello y los 213 barrios (con sus tarifas: $9.000
propia en Medellín, $9.900 por barrio, mismo día antes de la 1:00 p.m.)
usando como fuente el respaldo pre-rearquitectura
`.data/backups/shoppluscol-2026-07-30T19-16-17Z.sqlite` (creado al inicio
del Paso 1 con `npm run db:backup`), reproduciendo exactamente la lógica de
la migración de datos original. Se verificó `PRAGMA integrity_check` = `ok`
y `PRAGMA foreign_key_check` sin filas antes de continuar, y se confirmó
visualmente en el panel que los 213 barrios y sus tarifas volvieron a
aparecer.

**Esto solo afectó `.data/local.db` (base de desarrollo local, no
versionada en git).** No se tocó ninguna base de producción ni ningún
recurso externo. Se recomienda que el propietario revise personalmente
`/admin/envios` antes de confiar en los datos de Medellín, y considere este
incidente al decidir si aprobar el despliegue — no se declara "luz verde"
en ningún momento de esta ronda.

## Verificación

- `typecheck`, `lint`, `test` (99/99), build Next y build Cloudflare:
  correctos.
- `test:e2e`: 15/15, incluida una prueba nueva
  (`shipping-zones.spec.ts`) que crea departamento → ciudad → barrio desde
  el panel, fija una tarifa propia, la verifica exactamente en el
  checkout, confirma que "sin cobertura" bloquea la cotización sin
  desaparecer del selector, confirma que un departamento sin ciudades
  configuradas no pide ciudad, y elimina el departamento de prueba
  (verificando en el camino la corrección de la cascada de eliminación).
  Reemplaza `neighborhood-groups.spec.ts` (probaba la interfaz retirada).
- `npm run security:secrets`: 0 secretos encontrados. `npm audit
  --omit=dev`: una advertencia moderada preexistente en `drizzle-kit`/
  `esbuild` (herramienta de desarrollo, no se envía a producción), no
  introducida por esta ronda.
- Verificado en el navegador real contra `.data/local.db`, no solo con
  pruebas automatizadas: creación/edición/eliminación de zona en los tres
  niveles, herencia visible ("Heredado de Antioquia: $13.900"), búsqueda
  global de zonas, filtro dentro de una ciudad con más de 200 barrios,
  checkout completo con departamento sin ciudades configuradas (Bogotá
  D.C.) y con barrio con tarifa propia (El Poblado, $9.900).

## Pendiente

- Esta ronda **no aprueba producción, no hace merge y no constituye
  autorización para desplegar**. Queda pendiente de revisión humana —
  en particular, revisar el incidente de pérdida/restauración de datos
  descrito arriba antes de decidir sobre el despliegue.
- La zona "Resto de Colombia" (respaldo nacional) sigue **Inactiva**, un
  estado preexistente a esta ronda (no se investigó ni cambió): mientras
  siga así, ningún destino fuera de Antioquia recibe cotización — el
  checkout responde correctamente "Cotización requerida", pero vale la pena
  que el propietario decida si eso es lo que quiere.
- Puntos 5, 6 y 7 de la ronda de trabajo siguen sin empezar: nombre/
  descripción editable de métodos de pago, lista curada de textos
  editables del sitio, y editor visual con vista previa en vivo + edición
  de texto en línea.
