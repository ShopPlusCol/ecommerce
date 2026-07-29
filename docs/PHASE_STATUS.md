# PHASE_STATUS

## Estado

**Fase 4 implementada técnicamente en `fase-4-codex`, pendiente de las tres
validaciones manuales finales y de la aprobación expresa del propietario.**
Base recibida: `80d165c`. No se ha hecho merge a `main`, despliegue, dominio,
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
- Vitest: 46/46. Playwright: 6/6 sobre base aislada.
- Axe WCAG 2.2 AA crítica/seria: 0 hallazgos en rutas principales.
- Responsive: sin overflow a 390×844 y 1440×900.
- Lighthouse local producción:
  - Inicio: Performance 90, Accessibility 100, Best Practices 100, SEO 100;
    LCP 3,3 s, TBT 190 ms, CLS 0.
  - Producto: 95/100/100/100; LCP 2,9 s, TBT 40 ms, CLS 0.
- Auditoría de producción: 0 vulnerabilidades altas/críticas; quedan 4
  moderadas en la cadena de desarrollo de Drizzle Kit/esbuild. La auditoría
  completa añade avisos altos en tooling de ESLint/OpenNext sin corrección
  compatible; no se aplicó `--force`.

## Pendiente externo y humano

- Cloudflare: crear D1/R2/Worker de staging y validar preview remoto.
- Mercado Pago: credenciales sandbox y prueba oficial de preferencia/webhook.
- Meta: credenciales de prueba, consentimiento y autorización antes de un test
  event; no se enviaron eventos.
- SMTP: proveedor/credenciales y prueba de recuperación.
- Contenido: fotografías reales, datos legales, cuenta bancaria, contactos,
  textos comerciales y dominio definitivo.
- La salida a producción **no está aprobada**.
