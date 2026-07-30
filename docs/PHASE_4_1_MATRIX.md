# Matriz funcional final — Fase 4.1

Fecha de auditoría local: 2026-07-29. Rama: `fase-4-codex`.

| Módulo / requisito | Ruta y controles reales | Persistencia y permisos | Auditoría / pruebas | Experiencia visual |
|---|---|---|---|---|
| Dashboard operativo | `/admin`; alertas, accesos, pedidos, métricas, actividad | Consultas reales; `dashboard:read` | Unitarios indirectos + E2E administrativo | Jerarquía por atención, vacío accionable |
| Productos y medios | `/admin/productos`, `/admin/productos/[id]`, `/admin/productos/edicion-masiva`; alta, galería, carga directa, orden, edición múltiple y CSV | Catálogo/relaciones/medios; `catalog:*` y `media:create`; guardado masivo por bloques sin límite funcional | Auditoría individual/masiva; unitarios de lotes y validación; recorrido navegador hasta storefront | Portada explícita, filtros, selector de biblioteca, carga local y tarjetas responsive |
| Inventario ampliado | `/admin/inventario`; filtros, ajustes, reservas, liberación, exportación | D1/SQLite; `inventory:*`; bloqueo de negativo | Auditoría antes/después; unitarios de invariantes | Tabla responsive, estados traducidos |
| Envíos y zonas | `/admin/envios`; CRUD y cotizador | Reglas jerárquicas y métodos permitidos; `shipping:*` | Auditoría; unitarios de límites | Formularios seccionados y simulación clara |
| Editor visual | `/admin/editor`, `/admin/editor/[id]`, `/preview`; bloques, orden, duplicado, visibilidad, SEO, publicación, restauración | Versiones inmutables; `content:*` | Auditoría por acción; contrato validado con unitarios | Borrador/publicación diferenciados, historial sticky |
| Analítica | `/admin/analitica`; fechas, comparación, rankings, embudo, CSV, eventos técnicos | Pedidos/eventos reales; `dashboard:read/export` | Exportación auditada; unitarios de exclusión y cobros | Pestañas separadas y vacíos honestos |
| Integraciones | `/admin/integraciones`; estado, modo, diagnóstico local | Solo metadatos, nunca secretos; `integrations:*` | Auditoría; no se fingió conectividad externa | Tarjetas por proveedor y faltantes explícitos |
| Usuarios y roles | `/admin/usuarios`; alta, rol, estado, sesiones, contraseña | Identidad/roles; `users:*`; último propietario protegido | Auditoría; agrupación idempotente por usuario | Fichas operativas responsive |
| Simulador | `/admin/simulador`; antes/después, escala, posición, opacidad, brillo, saturación, mezcla, rotación, perspectiva y estado | Texturas y calibración; `catalog:*` | Auditoría; repositorio solo expone aprobadas | Previsualización local en tiempo real |
| Auditoría | `/admin/auditoria`; búsqueda, filtros, fechas, paginación y CSV | Solo `audit:read/export` | Sanitización probada; export auditado | Descripciones humanas y cambios plegables |
| Configuración | `/admin/configuracion`; marca, logos, iconos, OG, QR, privacidad y exportación | `settings:*`; biblioteca multimedia | Cambios auditados | Secciones navegables y previsualización |
| Restablecimiento de ventas | `/admin/pedidos` y `/admin/clientes`; limpieza total con frase, reconocimiento y confirmación | Solo propietario; cascadas controladas, reservas liberadas y recuperación solo por backup | Auditoría agregada; unitarios de confirmación y E2E destructivo sobre DB aislada | Zona de peligro diferenciada y botón bloqueado hasta completar requisitos |
| Estado | `/admin/estado`; aplicación, DB, migraciones, storage, auth, backups y proveedores | Diagnóstico de lectura; `settings:read` | API privada sin secretos | Estados semánticos y última comprobación |
| Shell y sistema de diseño | Todas las rutas `/admin/*`; navegación, búsqueda, usuario y sidebar colapsable | Sesión protegida | E2E, accesibilidad y responsive | Tokens compartidos, foco visible, móvil/escritorio coherentes |

## Comparación con las fuentes

- `PROMPT_MAESTRO.md`: el bloque administrativo de Fase 4.1 cubre gestión, seguridad, portabilidad, observabilidad, simulador, auditoría y salida preparada; producción sigue sin aprobarse.
- Prompt completo de Fase 4.1: los diez módulos prioritarios tienen controles conectados, no solo tablas. Productos, medios, búsqueda, clientes y pedidos aprobados se conservaron.
- Ampliación operativa posterior: productos admiten fotos desde PC y edición masiva de nombre, imagen, categorías, familia, precios y estado; los textos de alta son específicos y pedidos/clientes pueden restablecerse de forma protegida.
- Rutas reales: todas las rutas listadas arriba existen en el build Next y están protegidas.
- Persistencia: SQLite local y D1 comparten Drizzle; almacenamiento usa adaptador local/R2.
- Integraciones externas: Mercado Pago, Meta, SMTP, R2, D1 y Worker permanecen pendientes de credenciales o validación real cuando el entorno no las aporta.

## Problemas visuales conocidos

- La carga de imágenes no incluye recorte integrado; permite subir, seleccionar,
  previsualizar, ordenar, reemplazar o eliminar según el módulo.
- Las tablas de módulos heredados usan tarjeta/scroll controlado en móvil; una futura mejora puede ofrecer personalización de columnas.
- No se declara aprobación de producción ni éxito de proveedores externos.

# Auditoría final — `fase-4-claude-review` (2026-07-29)

Auditoría funcional y visual sobre la base `d4081f6`, con recorrido real en
navegador (no solo lectura de código) y línea base completa antes y después
de los cambios. Detalle de hallazgos y correcciones en `PHASE_STATUS.md`.

## Errores reales corregidos

- `/admin/productos/edicion-masiva` fallaba con "Error en el panel": el
  editor de producto individual guardaba la URL de imagen con un espacio
  final (`detail-actions.ts` no recortaba antes del separador `|`), y
  `next/image` rechaza URLs con espacio. Se corrigió el parseo y el dato ya
  guardado en la base local.
- `/admin/estado` mostraba "Migraciones" y "Almacenamiento" como correctos
  de forma incondicional, sin verificación real. Ahora migraciones compara
  el conteo aplicado contra el manifiesto real y almacenamiento hace una
  prueba de escritura (local) o `head()` (R2).
- `status-labels.ts` no traducía varios estados de pedido/pago
  (`pending_payment`, `advance_pending`, etc.) ni los de recompensas/pop-ups/
  cupones/promociones/contenido, que se mostraban en inglés crudo en el
  título plegable de cada registro.
- Componente `admin-module-placeholder.tsx` sin uso en ningún módulo actual:
  eliminado.

## Rediseño visual y de UX

- Edición masiva de productos: de tarjetas verticales por producto a una
  tabla compacta tipo hoja de cálculo, con encabezado y columna de
  selección fijos y miniatura clicable que expande slug/descripción/
  categorías/imagen. Mismo contrato de datos y guardado por bloques.
- `/admin/pagos`, `/admin/pedidos` y `/admin/productos` eran las últimas
  pantallas con tablas HTML sin estilo ni estado vacío; ahora usan el
  mismo lenguaje visual que `/admin/inventario` (filtros, badges de
  estado, estados vacíos reales, miniatura de producto).
- Editor visual: el contenido de cada bloque se editaba como JSON crudo.
  Ahora usa campos guiados generados a partir de la propia configuración
  (texto, número, casilla, listas repetibles para beneficios/testimonios/
  preguntas, selector de origen para colecciones de productos), con un
  modo "JSON avanzado" opcional para casos no cubiertos.
- Imágenes de producto (catálogo, tarjetas, ficha de producto, colecciones
  del home) pasan de `aspect-[4/5]` a `aspect-square` para un recorte 1:1
  consistente; el skeleton de `/catalogo` ya usaba `aspect-square`, así que
  ahora coincide con la tarjeta real.

## Pendiente observado, no corregido en esta pasada

- La ficha de producto pública solo muestra `product.media[0]`; no existe
  galería con miniaturas para las imágenes adicionales que sí admite el
  editor. Queda como mejora futura, fuera del alcance pedido en esta
  auditoría.
- El recorte de imágenes sigue sin implementarse (documentado desde la
  fase anterior); se mantiene la carga/selección/orden existentes.
- `/admin/auditoria` traduce las acciones más frecuentes, pero algunas
  siguen mostrando el nombre técnico de la entidad (p. ej.
  "ShippingRule · update") en vez de una frase totalmente en español.

# Ronda 2 — diez mejoras solicitadas (2026-07-30)

| Pedido | Ruta y controles reales | Persistencia | Verificación |
|---|---|---|---|
| Multimedia: multi-carga, nombre original, cuadrícula, borrado sin motivo | `/admin/medios` | Almacenamiento local/R2; `media:*` | Subida real de varios archivos, miniaturas revisadas |
| Carga instantánea de imagen en todos lados | Editor de producto individual, edición masiva, pop-ups | Igual que arriba | Selección de archivo dispara la subida sin botón aparte |
| Envío gratis restringido por zona | `/admin/recompensas`; `reward_rules.eligible_zone_ids` (migración `0010`) | `evaluateRewards` con `zoneIds`; autoritativo en cliente y servidor | Pedido real a Medellín (gratis) vs. Bogotá (tarifa normal) |
| Límite de unidades por categoría en carrito | `/admin/productos` y edición masiva; `products.limit_category_id`/`max_units_per_category_unit` (migración `0009`) | `maxAllowedByPurchaseLimit` en cliente y servidor | Unitarios + clamp verificado en carrito |
| Inventario compacto + ajuste masivo | `/admin/inventario` | `inventory_items`; `inventory:*` | Ajuste por fila con motivo obligatorio |
| Pop-ups funcionales | `/(store)` vía `<PromoPopup>`; `/admin/popups` | `popups`; `promotions:*` | Disparo por retraso/scroll/salida probado en navegador |
| Barrios de Medellín configurables | `/admin/envios` (zonas nivel "Barrio") → checkout | `shipping_zones`; `shipping:*` | Lista del checkout coincide con zonas configuradas |
| Editor visual: arrastrar y soltar | `/admin/editor/[id]`; asa ⠿ + `reorderBlocksAction` | Reordena `page_sections.order` en un viaje | Arrastre real, orden persiste tras recargar |
| Confirmación visible al guardar en Configuración | `/admin/configuracion` | `settings:*` vía `useActionState` | Mensaje de éxito visible tras guardar cada formulario |
| Zonas de peligro colapsadas | `/admin/pedidos`, `/admin/clientes` | Sin cambio de datos, solo presentación | E2E ajustado para abrir el `<details>` antes de interactuar |

Detalle narrativo de cada cambio, hallazgos y verificación repetida de línea
base: `PHASE_STATUS.md`.

# Grupos de barrios con tarifa propia (2026-07-30)

| Capacidad | Ruta y controles reales | Persistencia | Verificación |
|---|---|---|---|
| Grupos de barrios por ciudad | `/admin/envios`; pestañas por grupo, pegar barrios separados por coma, arrastrar pastillas entre grupos | `shipping_zones.neighborhood_names`/`group_kind` (migración `0011`) | 12 pruebas Playwright incluyendo arrastre real; uso real del propietario con 224 barrios |
| Tarifa compartida o individual | Tarifa/tiempos/mensaje integrados en la pestaña del grupo (un grupo de 1 barrio = tarifa individual) | `shipping_rules` vinculada al grupo | Pedido real a un barrio del grupo cobra la tarifa del grupo, no la de ciudad |
| Barrios sin cobertura | Pestaña reservada "Sin cobertura" por ciudad | `shipping_rules.blocks_delivery` gana por especificidad y no hereda tarifa | Unitarios de `resolveShippingQuote`; el barrio no aparece en el checkout |
| Barrio obligatorio sin grupos configurados | Checkout: `Input` en vez de `SelectField` | Sin cambio de esquema, solo validación de formulario | Playwright: envío sin barrio muestra el error y no se confirma el pedido |

Superset del renglón "Barrios de Medellín configurables" de la ronda 2:
ahora aplica a cualquier ciudad, admite grupos con varios barrios y agrega
sin cobertura. Detalle completo en `PHASE_STATUS.md`.
