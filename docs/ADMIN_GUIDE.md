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
- Edición masiva: abre `/admin/productos/edicion-masiva`, busca productos,
  selecciona cualquier cantidad y cambia nombre, slug, SKU, precios, estado,
  categorías, familia de color, imagen principal y opciones comerciales. El
  guardado se envía por bloques técnicos para no imponer un límite funcional.
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
- **Editor:** crea la página en `/admin/editor`, agrega bloques, guarda el borrador, abre la vista previa y publica. Restaurar siempre crea otra versión.
- **Analítica:** selecciona fechas en `/admin/analitica`; “Negocio” usa pedidos reales y “Eventos técnicos” diagnostica instrumentación.
- **Usuarios:** crea una cuenta con contraseña temporal, asigna un rol, revoca sesiones o cambia la contraseña. No puede suspenderse al último propietario activo.
- **Simulador:** calibra sobre la imagen local, guarda como borrador y selecciona “Aprobar y activar” solo tras revisar el resultado.
- **Integraciones y estado:** los diagnósticos comprueban presencia local de variables; nunca demuestran conectividad externa ni muestran secretos.
- **Configuración:** logos, favicon, Apple Touch Icon, Open Graph y QR se seleccionan desde Multimedia, con previsualización y eliminación.
- **Imágenes:** productos, categorías, promociones, pop-ups y configuración visual admiten carga directa desde el equipo mediante el mismo adaptador local/R2 y conservan la validación de formato.
- **Lenguaje operativo:** las acciones genéricas fueron reemplazadas por instrucciones concretas como “Añadir una nueva categoría” o “Añadir una nueva regla de envío”.
