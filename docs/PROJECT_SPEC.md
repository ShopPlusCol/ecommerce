# PROJECT_SPEC

Resumen ejecutivo. La especificación completa y vinculante es [`PROMPT_MAESTRO.md`](../PROMPT_MAESTRO.md); este documento es un mapa de navegación, no un reemplazo.

## Producto

ShopPlusCol: tienda premium de lentes de contacto cosméticos sin fórmula ni aumento. Mercado inicial: Medellín y Área Metropolitana, con envíos a toda Colombia. ~50 referencias de color + ~5 de Halloween + accesorios (solución, pinza/aplicador, kits). Precio de referencia: $49.000 COP por par. Moneda COP, idioma es-CO, zona horaria `America/Bogota`.

## Objetivos de negocio (sección 3 del prompt maestro)

Aumentar conversión desde Meta Ads, reducir pasos de compra, aumentar ticket promedio, reducir preguntas repetidas por WhatsApp, calcular correctamente envíos y pagos parciales, permitir administración sin tocar código, medir el embudo completo, mantener portabilidad de infraestructura.

## Fases (sección 44)

1. **Fundamentos, arquitectura y UX** — base técnica, sistema de diseño, layouts público/admin, modelo de datos, seed. *(en curso/cerrada en este documento — ver PHASE_STATUS)*
2. **Tienda pública y experiencia de compra** — catálogo, carrito, checkout, favoritos, upsells, recompensas, WhatsApp, analítica de interfaz, todo con datos reales de desarrollo.
3. **Backend, administrador e integraciones** — auth, panel conectado a base de datos, Mercado Pago, Meta Conversions API, cupones/promociones/pop-ups reales, auditoría.
4. **Simulador, hardening y salida a producción** — try-on por foto, rendimiento, seguridad, despliegue final.

## Reglas no negociables (resumen)

- Nunca fingir una integración activa; todo pendiente debe ser seguro, documentado y no romper el sistema.
- Cálculos de dinero, inventario y envío siempre verificados en servidor.
- Sin secretos en el repositorio; `.env.example` documenta cada variable.
- Arquitectura portable: el dominio no importa APIs de Cloudflare directamente (sección 28.1).
- Precios, categorías, zonas y promociones son datos administrables, nunca constantes de código.

## Alcance de esta fase

Ver [`docs/PHASE_STATUS.md`](./PHASE_STATUS.md) para el detalle exacto de qué existe hoy y qué queda para la Fase 2.
