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

# Envíos y zonas: pastillas por grupo, alta y edición masiva (Ronda 4, 2026-07-31)

## Diseño

Sobre el árbol Departamento → Ciudad → Barrio de la Ronda 3, el propietario
pidió: (1) barrios como pastillas arrastrables organizadas en 3 grupos fijos
("Con cobertura" / "Sin cobertura" / "Precio especial") con configuración
compartida por grupo, no por barrio; (2) que entrar a los hijos de una zona
no repita la configuración del padre, ya visible desde su tarjeta
"Configurar"; (3) alta masiva por coma también para departamentos y
ciudades, no solo barrios; (4) que los 32 departamentos + Bogotá D.C.
aparezcan precargados como zonas reales configurables (antes el checkout
usaba una lista estática aparte); (5) edición rápida masiva (tarifa,
cobertura, días hábiles) en los listados de departamentos y ciudades; (6)
un mensaje de "sin cobertura" personalizable globalmente, con el nombre del
destino. El editor visual con vista previa en vivo queda confirmado para
después de esta ronda, con el alcance ya acordado (vista previa + edición
de texto en línea, sin arrastrar/redimensionar bloques).

La configuración de "Sin cobertura"/"Precio especial" vive en una tabla
nueva (`shipping_neighborhood_group_settings`, una fila por ciudad × grupo)
que el panel usa para precargar el formulario del grupo y, al guardar,
escribir en bloque esos mismos valores sobre la `shipping_rules` de cada
barrio que hoy pertenece a ese grupo. El motor de cotización
(`resolveShippingQuote`) no cambió: sigue leyendo únicamente
`shipping_rules` por zona, exactamente igual que antes de esta ronda. El
grupo de un barrio se deriva de sus propios campos (`coverage`/`fee`), sin
columna nueva en `shipping_zones`/`shipping_rules`.

Además de lo pedido, durante la verificación con el propietario se agregó
selección múltiple de pastillas (casilla individual, "Todos" por columna,
"Seleccionar todo" global) para mover o eliminar varias a la vez en una
sola acción de servidor.

## Bugs reales encontrados y corregidos durante la verificación

- **`seed.ts` duplicaba "Antioquia" y "Medellín".** El seed de ejemplo
  insertaba esas zonas sin comprobar si ya existían (el id es aleatorio y
  nunca choca, así que `onConflictDoNothing()` no evitaba el duplicado).
  Al correr sobre una base ya migrada con los 33 departamentos precargados
  (pieza 4 de esta ronda), el checkout terminaba mostrando "Antioquia" dos
  veces en el selector — lo detectó el propio `test:e2e`
  (`smoke.spec.ts`, violación de modo estricto de Playwright: 3 opciones
  "Antioquia"). Se corrigió buscando por nombre/nivel antes de insertar.
- **El tablero de pastillas no mostraba confirmación de éxito.** Mover una
  o varias pastillas solo mostraba mensaje si el servidor rechazaba la
  acción; un movimiento exitoso no daba ninguna señal visible (ni
  `role="status"` para lectores de pantalla) más allá de que la pastilla
  cambiara de columna. Se agregó el mensaje de éxito, igual que ya tenían
  el resto de los formularios del panel.
- `tests/e2e/shipping-zones.spec.ts` se reescribió para el nuevo flujo de
  pastillas (antes probaba el formulario "Configurar" por barrio, que el
  tablero reemplazó).

## Investigación: secuencia de movimientos no planeada durante la verificación

Durante la verificación de esta ronda, una revisión rutinaria de
`audit_logs` en `.data/local.db` mostró ~64 acciones
`shippingZone.barrioGroup.move` (todas moviendo barrios distintos de
"Precio especial" de vuelta a "Con cobertura", una por una, espaciadas
~1-3 segundos) seguidas de dos `shippingZone.delete` y un
`shippingZone.neighborhood.bulkCreate` sobre Medellín, en una ventana de
~90 segundos — ninguna de esas acciones correspondía a algo hecho
deliberadamente por Claude en esta sesión.

Se investigó antes de asumir que fuera un bug: `PRAGMA integrity_check` =
`ok`, `PRAGMA foreign_key_check` sin filas, sin nombres de barrio
duplicados, y el conteo de barrios de Medellín se mantuvo en 213 (64 en
"Con cobertura" / 0 en "Sin cobertura" / 149 en "Precio especial", suma
consistente con los 64 movimientos registrados). El `user_id` de todas
esas entradas correspondía a la cuenta real del propietario
(`owner@shoppluscol.local`), no a la cuenta de auditoría usada para las
pruebas automatizadas de esta sesión. Se confirmó directamente con el
propietario: fue él mismo probando el tablero de pastillas recién
construido en su propio navegador, en paralelo a esta sesión. No fue un
bug ni pérdida de datos — dos barrios ("Asomadera" y "Aldea Pablo VI")
quedaron con id nuevo y configuración por defecto ("Con cobertura") por
haber sido borrados y vueltos a crear vía pegado masivo durante esa
prueba; el propietario confirmó que ese estado es el esperado y no pidió
restaurarlos.

## Verificación

- `typecheck`, `lint`, `test` (99/99), `test:e2e` (15/15), build Next y
  build Cloudflare: correctos.
- `npm run security:secrets`: 0 secretos encontrados.
- Verificado en el navegador real: tablero de pastillas (mover, seleccionar
  varias, eliminar varias), grupo "Precio especial" configurado y aplicado
  de inmediato a sus miembros, checkout con los 33 departamentos, mensaje
  de "sin cobertura" con el nombre del destino sustituido.
- No se pudo iniciar sesión de administrador vía automatización de
  navegador para esta ronda (la política de la herramienta bloquea escribir
  contraseñas, incluso las de una cuenta de prueba propia); la verificación
  visual del tablero de pastillas la hizo el propietario directamente en su
  navegador, y quedó confirmada en la conversación.

## Pendiente

- Esta ronda **no aprueba producción, no hace merge y no constituye
  autorización para desplegar**. Queda pendiente de revisión humana.
- El mensaje fijo "Cotización requerida para esta dirección..." fue
  reemplazado por el mensaje global personalizable (pieza 6); si el
  propietario prefiere el texto anterior, puede escribirlo tal cual en
  Configuración → Envíos.
- Los 33 departamentos quedan precargados pero **sin tarifa propia**
  (salvo Antioquia, que ya la tenía): cada uno sigue sin cotizar hasta que
  el propietario le asigne una tarifa o mantenga la zona "Resto de
  Colombia" como respaldo activo — su estado ("Inactiva", preexistente a
  esta ronda) no se tocó.
- Puntos 5, 6 y 7 de la ronda de trabajo original (nombre/descripción
  editable de métodos de pago, lista curada de textos editables del sitio,
  y editor visual con vista previa en vivo + edición de texto en línea)
  siguen sin empezar; el editor visual queda explícitamente para después
  de esta ronda, con el alcance ya acordado.

# Métodos de pago editables + textos del sitio (2026-07-31)

Implementa los puntos 5 y 6 pendientes de la Ronda 4 (el punto 7, editor
visual, sigue sin empezar).

- **Métodos de pago:** nombre y descripción por método (`settings`,
  key="payment_methods"), reflejados en el checkout, el resumen financiero
  y el simulador admin. El valor por defecto vive en
  `domain/services/payments.ts` (`DEFAULT_PAYMENT_METHOD_COPY`, dominio
  puro) para poder importarse desde componentes de cliente sin arrastrar
  el driver de base de datos al bundle del navegador — el mismo patrón se
  repitió para `site-texts`.
- **Textos del sitio:** en vez de implementar una lista abierta, se mapeó
  primero qué texto del storefront estaba genuinamente hardcodeado y sin
  ningún mecanismo admin, y se presentó al propietario para elegir alcance
  (confirmó: solo los textos rápidos de alto impacto). Quedaron editables:
  banner del encabezado, plantillas de WhatsApp (consulta general y
  carrito), aviso de pago del checkout, y los tres textos de `/envíos`.
  Términos, Devoluciones y Cuidados quedan fuera de esta pasada (requieren
  migrarse al editor visual por bloques, no solo un campo de texto).
- **Dos bugs reales corregidos de paso** (detectados durante el mapeo, no
  decisiones de alcance): `/preguntas-frecuentes` ignoraba la tabla `faqs`
  real (con CRUD funcional en `/admin/contenido`) y mostraba datos de
  ejemplo fijos; y el botón de WhatsApp del carrito, el de "preguntar por
  WhatsApp" en la ficha de producto, el footer y `/contacto` usaban el
  número/correo fijo de `siteConfig` en vez de la marca editable
  (`brand.whatsapp`/`brand.email`) — solo el botón flotante lo hacía bien.

**Verificación:** `typecheck`, `lint`, `test` (99/99), `test:e2e` (15/15),
build Next y build Cloudflare, `security:secrets` (0 secretos):
correctos. No se verificó visualmente en navegador por la misma
restricción de la ronda anterior (la herramienta de automatización
bloquea escribir contraseñas de administrador, incluso de una cuenta de
prueba propia) — el propietario indicó que haría las pruebas manuales.
No se aprueba producción ni se hace merge.

# Mercado Pago, confirmaciones por correo, checkout configurable y
# auditoría de pre-lanzamiento (2026-07-31 → 2026-08-01)

## Configuración e integración de Mercado Pago

Se acompañó al propietario paso a paso por el dashboard real de Mercado
Pago (Checkout Pro, Access Token, evento de webhook "Pagos (legacy)",
URL de webhook provisional) hasta dejar `MERCADO_PAGO_ACCESS_TOKEN` y
`MERCADO_PAGO_WEBHOOK_SECRET` reales en `.env`. De paso, `/admin/
integraciones` dejó de mostrar como "pendiente" integraciones que en
realidad ya estaban configuradas (R2/D1 comprobaban variables de entorno
que el proyecto no usa; ahora comprueban los bindings reales de
Cloudflare) y ganó una guía "Cómo configurarlo" por integración.

**Dos bugs reales de pago corregidos**, reproducidos primero contra la
API real de Mercado Pago antes de tocar código:
- **"Mercado Pago rechazó la preferencia (400)"**: `auto_return` exige un
  `back_url.success` HTTPS real; con la URL provisional no-HTTPS de
  pruebas, Mercado Pago rechazaba la preferencia completa. Ahora
  `auto_return` solo se envía cuando la URL base es HTTPS.
- **`UNIQUE constraint failed: payments.idempotency_key`** al reintentar
  un pedido tras un fallo a mitad de camino: `createDemoOrderAction` no
  deshacía el pedido/pago ya insertados antes de fallar, así que el
  reintento con la misma clave de idempotencia chocaba. Se agregó
  limpieza (rollback manual) de `orders`/`payments`/`consentRecords` en
  el `catch`.

Efecto secundario real encontrado al depurar: secretos reales de `.env`
se filtraban al entorno aislado de `test:e2e` porque Next.js carga `.env`
directamente del disco dentro de cada proceso hijo para cualquier
variable no definida explícitamente — `scripts/e2e-server.mjs` ahora
bloquea explícitamente (cadena vacía) las variables sensibles.

## Correos de confirmación, salto al primer error, checkout configurable

- **Correos de confirmación de pedido:** `ConfiguredNotificationProvider`
  pasa de stub a envío real por SMTP (`nodemailer`); si el cliente dejó
  correo, `createDemoOrderAction` envía una confirmación con los datos
  reales del pedido sin bloquear la respuesta si el envío falla.
- **Salto al primer campo con error:** al fallar la validación del
  checkout, la página hace scroll y da foco al primer campo con error en
  vez de dejar el mensaje fuera de vista. De paso se corrigió que
  `errors.quote` (falta de cobertura de envío) nunca se mostraba en
  pantalla.
- **Formulario de checkout configurable:** cada campo (excepto
  nombre/teléfono/ubicación/dirección, siempre obligatorios) puede
  activarse/desactivarse, marcarse obligatorio u opcional, y reordenarse
  desde Configuración → Formulario de checkout (`checkout_fields` en
  `settings`, validado y forzado en servidor para los campos bloqueados).

## Auditoría de pre-lanzamiento y correcciones (Fase E)

A pedido del propietario ("Estoy a punto de lanzar... revisa
exhaustivamente...") se hizo primero una auditoría de solo lectura (sin
tocar código/datos) cruzando checkout, pagos, inventario, envíos,
seguridad y configuración de producción, con hallazgos clasificados por
severidad. El propietario autorizó corregir todo lo que no fuera "solo
configurar un valor en el panel" (eso lo completa él mismo tras el
lanzamiento). Se corrigió, cada pieza verificada con `typecheck`/`lint`/
`test`/`build`/`cf:build` y su propio commit:

- **Límites de uso de cupones:** `usageLimitTotal`, `usageLimitPerCustomer`
  y `firstOrderOnly` existían en la tabla y el panel pero nunca se
  validaban — cualquier cupón se podía usar un número ilimitado de veces.
  Ahora `validateCoupon()` los evalúa contra `coupon_redemptions`
  (autoritativo en `createDemoOrderAction`) y cada pedido registra su
  canje.
- **Transiciones de estado de pedido sin validar:** un pedido "entregado"
  se podía regresar a "borrador" sin ninguna restricción. Se agregó una
  matriz de transiciones válidas (`src/domain/services/order-status.ts`)
  exigida en servidor y reflejada en los selectores del panel (detalle y
  listado de pedidos).
- **Inventario no se reponía al cancelar/devolver un pedido:** quedaba
  bloqueado indefinidamente. `restockOrderInventory` libera reservas
  activas y repone a stock disponible las ya vendidas, al entrar a
  "cancelled"/"returned".
- **Guard `newlyApproved` del webhook de Mercado Pago no era atómico:**
  dos entregas concurrentes del mismo webhook podían descontar inventario
  dos veces. Ahora la transición a "approved" se reclama con un
  `UPDATE ... WHERE status != 'approved'`.
- **`searchZonesAction` sin `requirePermission`:** cualquiera podía
  invocar la server action y enumerar todo el árbol de zonas sin sesión
  de admin. `validateCouponAction` no tenía límite de tasa (fuerza bruta
  de cupones). Ambos corregidos.
- **Reservas de inventario vencidas solo se liberaban al confirmar un
  pedido:** un carrito abandonado bloqueaba stock hasta que otra persona
  completara una compra. `quoteShippingAction` (mucho más frecuente,
  cada cambio de dirección) también las libera ahora.
- **Secretos horneados en el build de Cloudflare:** confirmado y
  reproducido con un `cf:build` real — el Access Token y Webhook Secret
  reales de Mercado Pago quedaban en texto plano en
  `.open-next/cloudflare/next-env.mjs` (fallback que vuelca todo
  `process.env` visto durante el build) y como copia literal de `.env`
  en `.open-next/server-functions/default/.env` (trazado de archivos de
  Next.js). Ambos quedan dentro de lo que `wrangler deploy` sube.
  `scripts/run-cloudflare.mjs` ahora limpia esos valores después de cada
  build; verificado con grep sobre `.open-next/` que no queda rastro del
  secreto real.
- **Catálogo se hidrataba 4-5 veces por vista de producto:** cada llamada
  a `getProductBySlug`/`getRelatedProducts`/`getUpsellProducts`
  relanzaba las mismas 5 consultas sobre el catálogo completo.
  `React.cache()` las deduplica dentro de la misma petición de servidor.
- **Listados admin sin paginación real:** `/admin/pedidos`,
  `/admin/clientes`, `/admin/productos` y `/admin/pagos` hacían `SELECT`
  sin límite (clientes, además, cargaba la tabla completa al navegador
  para paginar ahí). Ahora los cuatro filtran y paginan con
  `LIMIT`/`OFFSET` en el servidor, igual que `/admin/auditoria`.
- **Índices de base de datos faltantes:** `audit_logs.created_at`,
  `carts.session_token`, `order_items.order_id`,
  `manual_transfer_proofs.payment_id`, `inventory_reservations.order_id`
  y `(status, expires_at)`. Migración `0018`, generada con `drizzle-kit`
  y aplicada/verificada sobre `local.db`.
- **Montaje del checkout disparaba 4 fetches de cliente evitables**
  (departamentos, copy de métodos de pago, textos del sitio, config de
  campos): ninguno depende del carrito ni de la sesión, así que ahora se
  resuelven en el server component antes de renderizar. Se marcó la ruta
  `force-dynamic` explícitamente — sin eso, Next.js podía prerenderizar
  esos valores administrables en build y congelarlos hasta el próximo
  despliegue (se detectó porque `/checkout` seguía apareciendo como
  ruta estática después del cambio).

### Verificación

- `typecheck`, `lint`, `test` (116/116 en 19 archivos, incluidas pruebas
  nuevas para límites de cupón y transiciones de estado), build Next y
  `cf:build`: correctos en cada commit de esta ronda.
- `test:e2e`: 12-15/15 según la corrida — ver "Pendiente" abajo, un caso
  puntual queda documentado como investigación separada, no oculto.
- `cf:build` real ejecutado dos veces con los secretos reales del
  propietario en `.env`; confirmado con `grep` que ninguno sobrevive en
  `.open-next/` tras la limpieza.
- Login de administrador vía navegador automatizado sigue bloqueado por
  la misma política de esta sesión (no se escriben contraseñas, ni de
  cuentas de prueba propias); las cuatro páginas de listado con
  paginación nueva se verificaron por tipos/lint/build y por espejar
  exactamente el patrón ya probado de `/admin/auditoria`, no con una
  sesión de admin en vivo.

### Pendiente

- **`tests/e2e/shipping-zones.spec.ts:90` falla de forma consistente**
  (4/4 corridas) contra el harness de E2E (build de producción + base
  fresca), pero no se reproduce en el servidor de desarrollo normal.
  Falla específicamente al seleccionar un departamento recién creado en
  el mismo test serial; "Bogotá D.C." (departamento pre-sembrado) es
  intermitente. Se investigó y descartó una hipótesis de doble
  codificación UTF-8 (confirmada como artefacto de las herramientas de
  inspección, no un bug real, con inspección directa del DOM). No se
  encontró la causa raíz; no bloquea el resto de esta ronda pero sigue
  abierto como investigación aparte.
- **Cuenta de prueba con rol Propietario** (`auditoria-claude@
  shoppluscol.local`, creada en una ronda anterior de esta sesión) sigue
  en `.data/local.db`; el propietario prefirió eliminarla él mismo en
  vez de que lo hiciera Claude.
- **Dos cuentas de propietario** coexisten en `.data/local.db`:
  `owner@shopluscol.local` (typo, nunca inició sesión) y
  `owner@shoppluscol.local` (la que sí se usa). Señalado al propietario;
  no se eliminó ninguna — es su decisión.
- Todo lo explícitamente excluido por el propietario de esta ronda sigue
  pendiente y es intencional, no un olvido: secretos/credenciales reales
  (Mercado Pago producción, SMTP, `BETTER_AUTH_SECRET`), creación del D1
  real y reemplazo del `database_id` placeholder en `wrangler.jsonc`,
  activación de la zona "Resto de Colombia" y tarifas de departamentos
  fuera de Antioquia, y cualquier otro ajuste que se hace desde el panel.
- Esta ronda **no aprueba producción, no hace merge, no despliega y no
  constituye autorización para lanzar**. Queda pendiente de revisión y
  decisión del propietario.

# Ronda de conversión, UX y analítica (2026-08-04)

Rama `mejora-conversion-ecommerce-2026-08`, desde `5bee800`. Sin push, sin
despliegue, sin aprobación de producción.

## Punto de partida: la línea base venía rota

El árbol de trabajo tenía cambios sin confirmar de una sesión previa
(migración `0019` + canjes de cupón) a medio cablear: **2 errores de
TypeScript y 1 prueba fallando**. Se preservaron primero en su propio commit
(`3ce9912`) y en `git stash` como punto de recuperación, y luego se
completaron:

- `marketingConsentValue` (tres estados: null = la casilla no se presentó)
  se calculaba pero los tres puntos de escritura usaban el valor crudo del
  cliente.
- `normalizedContact` descartaba los campos desactivados en configuración,
  pero el pedido seguía guardando `data.contact` sin normalizar: un cliente
  manipulado podía escribir en campos que el comercio tenía apagados.
- `claimCouponRedemption` (reclamo atómico, ya escrito y probado) no estaba
  conectado: dos pedidos simultáneos podían pasarse ambos del cupo del cupón.
- `phase3-persistence.test.ts` mantenía a mano una lista de migraciones ya
  desactualizada, lo que ocultaba el desajuste del esquema.

## Entregado

- **Hero comercial**: precio real del catálogo (marcador `{precio}`), qué
  incluye/no incluye, soporte de fotografía real. Ver
  `docs/CONVERSION_UX_AUDIT.md`.
- **Promesas acotadas por datos**: `store-promise.ts` + `storefront/offer.ts`
  — "mismo día" y "contra entrega" solo se muestran donde y cuando la
  configuración real de zonas lo permite, con la misma herencia que usa el
  checkout. Antes eran texto fijo en cuatro lugares.
- **Testimonios**: solo se publican los verificados; sin ninguno, la sección
  desaparece.
- **Meta Pixel + Conversions API completos**: el píxel no existía en el
  navegador. Nueve eventos, deduplicación por `event_id` compartido,
  `Purchase` solo desde servidor con garantía de una vez por pedido vía el
  índice único de `analytics_events.event_id`. Ver `docs/ANALYTICS_EVENTS.md`.
- **Ficha de producto**: incluye/no incluye + WhatsApp con intención de
  compra (producto, cantidad, precio, qué incluye, URL).
- **Consentimiento**: aviso compacto con tres categorías separadas, que ya no
  puede tapar el botón de confirmar del checkout.
- **Auditoría de contenido**: `scripts/audit-content.mjs` detecta productos
  sin foto real, imágenes reutilizadas, slugs inválidos, descuentos falsos y
  desajustes nombre/familia. Ver `docs/CONTENT_REQUIRED.md`.

## Verificación

- `typecheck`, `lint`: limpios (0 errores, 0 avisos).
- `test`: 135/135 en 22 archivos (11 nuevas).
- `test:e2e`: 15 pasan, 2 fallan — ver "Pendiente".
- `build` y `cf:build`: correctos.
- `security:secrets`: 0 secretos en 478 archivos.

### Incidencia de entorno: pnpm rompía el build de Cloudflare

`cf:build` fallaba con "Acceso denegado" leyendo dentro de
`node_modules/.pnpm/`: **`node_modules` estaba instalado con pnpm** aunque el
proyecto declara npm (`package-lock.json` es el lockfile versionado).
OpenNext no puede recorrer los enlaces de pnpm en Windows. Se reinstaló con
`npm ci` y el build volvió a pasar. Quedan `pnpm-lock.yaml` y
`pnpm-workspace.yaml` sin versionar en el repositorio: **si alguien vuelve a
ejecutar `pnpm install`, el build de Cloudflare se rompe otra vez.**

## Pendiente

- **`shipping-zones.spec.ts:98` y `:120` siguen fallando** al seleccionar una
  opción del combobox de departamento. Es el mismo fallo ya documentado en la
  ronda anterior (`:90`, 4/4 corridas) y **no se investigó en esta ronda**;
  ninguno de los archivos implicados (`SearchableSelect`, `checkout-client`,
  zonas de envío) fue modificado aquí.
- **No se rediseñaron catálogo, carrito ni checkout.** El encargo los
  incluía; se priorizó lo que ataca directamente los 244 contactos de baja
  calidad. Es la continuación natural.
- **No hay capturas antes/después**: la sesión no tenía panel de navegador
  visible. La verificación fue textual (DOM y árbol de accesibilidad).
- **Sin sesión de administrador en navegador** (la herramienta no escribe
  contraseñas): los cambios del panel se verificaron por tipos, lint, build y
  pruebas.
- Contenido real pendiente: ver `docs/CONTENT_REQUIRED.md`.
- Esta ronda **no aprueba producción, no hace merge y no autoriza a
  desplegar**.

# Continuación: cierre de la ronda de conversión (2026-08-04, segunda parte)

Continúa sobre `mejora-conversion-ecommerce-2026-08`. Se integró
`origin/main` (merge `6ab3ef3`): su árbol es idéntico al de `8db5e7f`, ya
ancestro de esta rama, así que no aportó cambios de contenido — solo deja la
historia enlazada. Sin push, sin merge a main, sin despliegue.

## Los dos E2E "preexistentes" tenían una causa real, y era un bug de la tienda

No eran fallos de las pruebas. El encabezado es `sticky` (ocupa sitio en el
flujo) y **encogía de 72px a 64px cuando `scrollY > 8`**: el umbral era
exactamente igual al cambio de altura, así que encoger volvía a cruzar el
umbral y disparaba el cambio contrario. La página vibraba de forma
permanente cerca del inicio.

Medido en navegador real: `window.scrollY` cambiaba en cada frame
(13, 13, 12, 11, 9, 6…) y la caja de una opción del desplegable se movía
~0,86px indefinidamente. Por eso Playwright fallaba con **"element is not
stable"** y no con "not found". Explicaba además la inestabilidad
intermitente de `product-gallery`.

Altura fija + señal de desplazamiento solo en la sombra (no afecta al
layout, no puede realimentarse). **`test:e2e` pasa 21/21 de forma
consistente**; Lighthouse reporta ahora **CLS 0** en inicio y producto.

## Analítica corregida

- **PageView duplicado**: `MetaPixel` y `PageViewTracker` lo emitían ambos, y
  el del píxel sin `event_id`. Ahora el píxel solo inicializa y hay una única
  fuente. El efecto dependía de `consent.analytics`, así que aceptar solo
  marketing no generaba ninguna vista y una preferencia guardada generaba dos
  al hidratar. Decisión extraída a `shouldEmitPageView` (pura, 9 pruebas).
- **Endpoint de reenvío endurecido**: origen acotado, límite de tasa por IP
  hasheada, un solo uso por `event_id`, esquema estricto por tipo de evento
  e **importe calculado en servidor** (el navegador ya no manda `value`).
- **Purchase reintentable**: bandeja de salida con
  `delivery_status`/`attempts`/`next_retry_at`/`last_error_code` (migración
  `0020`, aditiva y con backfill). Antes, un fallo de Meta perdía la compra
  para siempre. `recoverPendingPurchaseEvents` recupera lo pendiente.

## Rediseño completado

- **Catálogo**: filtros derivados de facetas reales con conteo (ya no se
  ofrecen filtros que llevan a resultado vacío), filtro por colección, panel
  inferior en móvil, objetivos táctiles de 44px.
- **Tarjetas**: se corrigió un **descuento falso** (el precio anterior se
  tachaba aunque no fuera mayor), etiqueta "Foto de ejemplo", "Lentes +
  estuche", disponibilidad y selector de imagen usable en táctil.
- **Carrito**: trampa de foco real y devolución del foco, familia y qué
  incluye por línea, CTA "Finalizar por WhatsApp".
- **Checkout**: barra fija inferior en móvil con total y confirmar, resumen
  plegable. **El aviso de privacidad tapaba ese botón**: se reservaban 10rem
  fijos y el aviso mide ~194px; ahora la altura se mide con `ResizeObserver`.

## Verificación (todos los scripts reales del proyecto)

| Comando | Resultado |
| --- | --- |
| `typecheck` | Limpio |
| `lint` | Limpio (0 avisos) |
| `test` | 162/162 en 24 archivos |
| `test:e2e` | 21/21 |
| `test:a11y` | 1/1, sin violaciones serias o críticas |
| `test:responsive` | 2/2 |
| `test:lighthouse` | Inicio 92/100/100/100 · Producto 91/100/100/100 · **CLS 0** |
| `build` | Correcto |
| `cf:build` | Correcto |
| `security:secrets` | 0 secretos en 451 archivos |

`test:lighthouse` **no se podía ejecutar** en esta máquina: el Chrome
completo de Playwright falla con "la configuración en paralelo no es
correcta" (falta el runtime de Visual C++). `resolveChromeExecutable` usa
ahora el headless shell como respaldo.

Capturas en `artifacts/ux-audit/` (10 archivos), generadas con
`npx playwright test tests/e2e/ux-screenshots.spec.ts`. Excluidas del
control de versiones y regenerables.

## Pendiente real

- **LCP 3,3-3,5 s**, por encima del objetivo de 2,5 s. No es una regresión
  (venía igual de rondas anteriores) y está ligado a que el hero no tiene
  fotografía real: hoy el elemento mayor es texto. Queda sin resolver.
- **No hay planificador para reintentar compras pendientes.** La función
  existe y es segura, pero hay que invocarla a mano tras una caída de Meta.
- Contenido real pendiente: ver `docs/CONTENT_REQUIRED.md` (7 de 8 productos
  sin foto propia; Alaska Gris con slug "21" y familia "Verde" pese a
  llamarse "Gris" — **no se corrigió a propósito**, requiere tu confirmación).
- Esta ronda **no aprueba producción, no hace merge y no autoriza a
  desplegar**.
