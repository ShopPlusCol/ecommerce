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
