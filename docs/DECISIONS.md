# DECISIONS

## Stack portable

Next.js 16.2.12, React 19.2.4, Tailwind 4, Drizzle/SQLite, Better Auth y
OpenNext Cloudflare. D1 y better-sqlite3 comparten esquema; R2 y disco local
implementan almacenamiento. El Dockerfile conserva el build estándar en lugar
de `standalone` para no interferir con OpenNext.

## Mantenimiento sin Proxy

Next 16 ofrece `proxy.ts`, pero OpenNext rechaza Proxy con runtime Node. El modo
mantenimiento se movió al layout público y la autenticación permanece en el
layout administrativo y las operaciones de servidor. Esto permite el build de
Workers sin debilitar `/admin`.

## Simulador local y bajo demanda

La fotografía no se sube. MediaPipe se importa al abrir el simulador y descarga
su modelo desde el proveedor configurado; la inferencia ocurre localmente.
Canvas no permite reconstruir una medida clínica, por lo que el resultado se
marca como orientativo. Se conserva fallback manual para incompatibilidad,
red restringida o detección fallida.

## Texturas administradas

El iris genérico SVG es fallback visual. Los activos finales se cargan desde el
panel, se validan, asocian a un producto y requieren aprobación. No se inventan
fotografías de producto como contenido definitivo.

## Privacidad y retención

La política técnica es editable, versionada y marcada como pendiente de
revisión humana. Los plazos son configuración operativa, no una conclusión
legal. El consentimiento opcional puede retirarse; Meta sigue inactivo sin
consentimiento, configuración y autorización.

## Rate limiting persistente

Se usa Web Crypto para hash de identificador y un UPSERT SQLite/D1 atómico. Las
fechas interpoladas en SQL se convierten a epoch numérico; pasar objetos `Date`
en SQL raw rompe better-sqlite3 y fue cubierto por el flujo E2E.

## Exportación y backup separados

La exportación JSON facilita portabilidad y solicitudes administrativas, pero
no sustituye un backup transaccional. SQLite usa `backup()`, `integrity_check`
y SHA-256; D1 debe usar backup/time travel o export oficial. Los binarios se
respaldan por separado.

## Observabilidad mínima y privada

El health público no expone proveedores ni conteos. El diagnóstico completo
requiere permiso. Logs y Web Vitals contienen evento, revisión, métrica y
tiempos; no incluyen secretos, datos de tarjeta, foto ni biometría.

## Auditoría de dependencias

Se fijaron versiones compatibles de `postcss` y `sharp`; producción queda con
0 vulnerabilidades altas/críticas. Quedan 4 moderadas en Drizzle Kit/esbuild y
avisos altos de desarrollo en `minimatch`/ESLint/OpenNext. `npm audit` propone
downgrades o saltos mayores incompatibles, por lo que no se aplicó
`npm audit fix --force`. Se revisarán cuando upstream publique una corrección
compatible.

## Windows y OpenNext

OpenNext intenta crear un symlink para `better-sqlite3`; Windows puede responder
EPERM. `postinstall` aplica un parche local, idempotente y limitado al fallback
de copia de directorio. No afecta Linux/CI. Debe retirarse cuando OpenNext lo
resuelva.
