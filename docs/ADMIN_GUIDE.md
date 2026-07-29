# ADMIN_GUIDE

Estado actual: **scaffold de navegación**, sin autenticación ni persistencia todavía (se activan en la Fase 3). Cada pantalla del panel muestra un aviso de desarrollo y, cuando aplica, la lista de campos/funciones que administrará una vez conectada.

## Acceso

`http://localhost:3000/admin` en desarrollo. No hay login: cualquiera con la URL puede entrar. **No desplegar este scaffold accesible públicamente** hasta que la Fase 3 añada autenticación real (sección 30).

## Navegación (sección 22.3)

| Grupo | Secciones |
| --- | --- |
| General | Resumen (KPIs, con estados vacíos honestos) |
| Ventas | Pedidos, Clientes, Pagos |
| Catálogo | Productos, Inventario, Categorías, Colecciones |
| Logística | Envíos y zonas |
| Marketing | Promociones, Cupones, Recompensas, Pop-ups |
| Contenido | Editor visual, Contenido |
| Sistema | Analítica, Integraciones, Usuarios y roles, Auditoría, Configuración |

## Qué existe hoy

- Layout con sidebar, topbar y aviso de modo desarrollo.
- Resumen con tarjetas de KPI en estado vacío (sin datos inventados).
- Cada módulo describe, en una lista, qué campos y acciones administrará (tomado directamente de las secciones correspondientes del prompt maestro).

## Qué falta (por fase)

- **Fase 2**: nada del panel — esa fase es 100% tienda pública.
- **Fase 3**: autenticación y roles, persistencia real contra la base de datos para todos los módulos listados arriba, carga masiva de productos, verificación manual de transferencias, Mercado Pago/Meta/WhatsApp configurables, auditoría real.

## Usuario propietario de desarrollo

Creado por `npm run db:seed` (`owner@shoppluscol.local`, contraseña impresa una sola vez en consola). No tiene ningún efecto todavía porque no existe pantalla de login; sirve para validar que el modelo de roles y el hash de contraseña funcionan de extremo a extremo.
