# ADMIN_GUIDE

## Acceso

```bash
npm run db:migrate
npm run db:seed
```

El seed muestra la contraseña solo al crear la credencial. El correo proviene
de `ADMIN_OWNER_EMAIL`. Guarda ambos en un gestor de contraseñas; no en Git,
capturas, documentación ni chats compartidos. Abre `/acceso-admin`.

## Operación

- Productos: alta, estado, CSV, galería con carga directa y metadatos. La
  edición individual permite subir, seleccionar, ordenar y retirar imágenes;
  la primera es la portada visible en la tienda.
- Edición masiva: abre `/admin/productos/edicion-masiva`. La tabla es
  compacta (encabezado y columna de selección fijos): marca los productos a
  editar, cambia nombre, SKU, estado, precios, familia de color o alerta de
  stock directamente en la fila, y usa el botón “Más” junto a cada producto
  para abrir slug, descripción corta, categorías e imagen. El guardado se
  envía por bloques técnicos para no imponer un límite funcional.
- Simulador: sube PNG/WebP cuadrado de hasta 2 MB, ajusta apariencia, guarda y
  aprueba solo tras revisar el producto real. Rechazar/pendiente no se publica.
- Inventario: todo ajuste requiere motivo y no puede invadir reservas.
- Pedidos/pagos: pedido y pago tienen estados separados. Un comprobante queda
  pendiente hasta revisión explícita; cargarlo nunca aprueba el pago.
- Configuración: identidad, transferencia, privacidad, retención y exportación.
  Los logos, iconos, Open Graph y QR pueden seleccionarse de Multimedia o
  cargarse directamente desde el equipo.
- Estado del sistema: confirma DB/runtime/revisión y si una integración está
  configurada, sin mostrar secretos.
- Auditoría: revisa actor, acción, entidad y cambios antes/después.

## Privacidad

En Configuración completa responsable, datos legales, correo, versión y
retención. No marques “Revisada” hasta que el negocio/asesor competente la
valide. La foto del simulador no aparece en medios ni exportaciones porque
nunca llega al servidor.

## Exportación y recuperación

- Panel: Configuración → Exportar datos de negocio.
- CLI: `npm run db:export`.
- Backup: `npm run db:backup`.
- Restauración: sigue [RECOVERY.md](./RECOVERY.md); nunca restaures con la
  aplicación escribiendo sobre la misma base.

### Restablecer ventas

Solo el propietario ve las zonas de limpieza en Pedidos y Clientes. Antes de
usarlas crea un backup. Pedidos elimina sus pagos, envíos e historial y libera
reservas; Clientes elimina perfiles, direcciones y consentimientos, pero los
pedidos que se conserven mantienen su instantánea histórica. Ambas acciones
exigen escribir una frase completa, marcar el reconocimiento y aceptar una
segunda confirmación. La recuperación posterior solo es posible desde backup.

## Seguridad

Tras cinco intentos fallidos se bloquea la identidad temporalmente. Cerrar
sesión usa el endpoint de Better Auth y se verifica al volver a `/admin`.
La recuperación responde de forma genérica y requiere SMTP para enviar correo.

## Integraciones pendientes

Mercado Pago sandbox, Meta Test Events, SMTP y R2 requieren credenciales o
recursos externos. El panel dice “Pendiente” hasta una validación real. No
habilites modo producción ni Meta desde el panel por anticipado.
# Operación añadida en Fase 4.1

- **Inventario:** filtra existencias y movimientos, exporta CSV, ajusta con motivo y libera reservas desde `/admin/inventario`. El servidor impide quedar por debajo de lo reservado.
- **Envíos:** administra zonas jerárquicas, vigencias, tarifas, tiempos y métodos; valida una dirección con el cotizador de `/admin/envios`.
- **Editor:** crea la página en `/admin/editor`, agrega bloques, guarda el borrador, abre la vista previa y publica. Restaurar siempre crea otra versión. El contenido de cada bloque se edita con campos guiados (texto, número, casilla, listas de beneficios/testimonios/preguntas); “Editar como JSON avanzado” sigue disponible para casos puntuales.
- **Analítica:** selecciona fechas en `/admin/analitica`; “Negocio” usa pedidos reales y “Eventos técnicos” diagnostica instrumentación.
- **Usuarios:** crea una cuenta con contraseña temporal, asigna un rol, revoca sesiones o cambia la contraseña. No puede suspenderse al último propietario activo.
- **Simulador:** calibra sobre la imagen local, guarda como borrador y selecciona “Aprobar y activar” solo tras revisar el resultado.
- **Integraciones y estado:** los diagnósticos comprueban presencia local de variables; nunca demuestran conectividad externa ni muestran secretos.
- **Configuración:** logos, favicon, Apple Touch Icon, Open Graph y QR se seleccionan desde Multimedia, con previsualización y eliminación.
- **Imágenes:** productos, categorías, promociones, pop-ups y configuración visual admiten carga directa desde el equipo mediante el mismo adaptador local/R2 y conservan la validación de formato.
- **Lenguaje operativo:** las acciones genéricas fueron reemplazadas por instrucciones concretas como “Añadir una nueva categoría” o “Añadir una nueva regla de envío”.
- **Pedidos, productos y pagos:** las tres pantallas tienen filtro por texto y estado, miniatura de producto donde aplica, y badges de estado traducidos; ya no dependen de recordar el enum interno.

# Operación añadida en Ronda 2 (2026-07-30)

- **Multimedia (`/admin/medios`):** puedes seleccionar varios archivos a la
  vez; cada uno se sube apenas lo eliges, conserva un nombre reconocible
  (basado en el nombre original) y se muestra como miniatura cuadrada.
  Eliminar un archivo ya no exige escribir un motivo.
- **Imágenes en productos y pop-ups:** en la ficha de producto (individual y
  edición masiva) y en pop-ups, seleccionar un archivo lo sube de inmediato;
  no hace falta un botón "Subir" separado.
- **Recompensas — envío gratis por zona (`/admin/recompensas`):** el campo
  "Ciudades/departamentos donde aplica" limita una recompensa de tipo
  "Envío gratis" a las zonas que elijas (barrios no incluidos, solo ciudad/
  departamento/país); si lo dejas vacío, aplica en todo el país. El cliente
  solo ve el envío gratis cuando su dirección coincide con una zona
  elegida, y el pedido se revalida en el servidor antes de confirmarse.
- **Límite de compra por categoría (`/admin/productos`):** en el detalle de
  producto y en edición masiva puedes fijar "Categoría límite" y "Máximo por
  unidad de categoría"; por ejemplo, si el cliente tiene 1 unidad de esa
  categoría en el carrito, este producto no pasará de esa cantidad. El
  carrito ajusta la cantidad automáticamente al llegar al tope.
- **Inventario (`/admin/inventario`):** además del ajuste individual, hay un
  bloque de ajuste masivo: escribe el ajuste (+/−) y el motivo en cada fila
  y solo se guardan las filas con ambos campos completos.
- **Pop-ups (`/admin/popups`):** ahora sí se muestran en la tienda. Configura
  imagen, texto, cupón opcional, rutas donde aparece/no aparece, frecuencia
  (una vez por sesión, una vez por período o siempre) y el disparador
  (retraso en segundos, porcentaje de scroll o intención de salida).
- **Grupos de barrios (`/admin/envios`, sección "Barrios por ciudad"):** cada
  ciudad con una zona configurada tiene su propio tablero. Escribe uno o
  varios nombres de barrio separados por coma en el cuadro (ej. "Guayabal,
  Castropol") y pulsa "Añadir": aparecen como pastillas en la pestaña activa.
  Arrastra una pastilla y suéltala sobre otra pestaña para mover ese barrio
  de grupo. Cada grupo tiene su propia tarifa, tiempos de entrega y mensaje
  al cliente — un grupo de un solo barrio funciona como tarifa individual.
  La pestaña **"Sin grupo"** es para barrios que se entregan pero sin tarifa
  propia (usan la tarifa general de la ciudad); la pestaña **"Sin
  cobertura"** es para barrios donde no se hace envío — el checkout no
  ofrece esos barrios como opción. Los barrios de cualquier grupo (salvo
  "Sin cobertura") aparecen automáticamente en el desplegable del checkout
  de esa ciudad; si una ciudad no tiene ningún barrio configurado, el
  checkout pide el barrio como texto libre obligatorio.
- **Editor visual (`/admin/editor/[id]`):** cada bloque tiene un asa de
  arrastre (⠿) junto al título; arrástralo sobre otro bloque para
  reordenar. Los botones ↑/↓ siguen disponibles como alternativa sin mouse.
- **Configuración (`/admin/configuracion`):** guardar marca, transferencia
  manual o privacidad ahora muestra un mensaje de confirmación visible bajo
  el botón; antes guardaba en silencio.
- **Zonas de peligro (`/admin/pedidos`, `/admin/clientes`):** "Limpiar
  todos los pedidos/clientes" está ahora colapsado por defecto; haz clic en
  el título para expandirlo antes de usarlo.
