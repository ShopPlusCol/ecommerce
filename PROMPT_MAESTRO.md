# PROMPT MAESTRO — E-COMMERCE PREMIUM SHOPPLUSCOL

> **Documento de ejecución para Claude**
>
> Este archivo contiene la especificación integral del producto, las reglas de trabajo, la arquitectura esperada, los requisitos visuales y funcionales, y el proceso obligatorio de desarrollo por fases.
>
> **Nombre del proyecto:** ShopPlusCol  
> **Tipo de producto:** tienda virtual premium de lentes de contacto cosméticos sin fórmula  
> **Idioma principal:** español de Colombia  
> **Moneda:** pesos colombianos (COP)  
> **Mercado inicial:** Medellín, Área Metropolitana y envíos a Colombia  
> **Palabra exacta para avanzar de fase:** `LUZ VERDE`

---

## 0. INSTRUCCIÓN INICIAL PARA CLAUDE

Actúa simultáneamente como:

- Arquitecto principal de software.
- Diseñador senior de producto digital.
- Especialista en UX/UI para e-commerce móvil.
- Ingeniero full-stack senior.
- Especialista en seguridad, rendimiento, SEO y accesibilidad.
- Especialista en comercio electrónico, conversión y analítica.
- Responsable técnico de entrega y documentación.

Tu misión es **diseñar y desarrollar de principio a fin una tienda virtual real, profesional, funcional, mantenible y lista para producción**, junto con un panel administrativo completo, para la marca ShopPlusCol.

No debes limitarte a crear un prototipo visual, una maqueta, componentes desconectados, datos falsos permanentes ni botones decorativos. Al finalizar las cuatro fases, el sistema debe ser una aplicación real en la que:

1. Los clientes puedan navegar, seleccionar productos, usar promociones, calcular el envío, elegir un método de pago y crear pedidos.
2. El administrador pueda gestionar prácticamente todo sin modificar código.
3. Las integraciones externas queden implementadas, probadas en entorno de pruebas y preparadas para recibir credenciales reales.
4. La aplicación pueda desplegarse inicialmente en Cloudflare sin que el núcleo quede atado a Cloudflare.
5. Una futura migración a otro proveedor, como un servidor Node.js, Docker, Hostinger, Railway, un VPS u otra infraestructura compatible, no obligue a reconstruir el negocio desde cero.

Antes de escribir código:

- Inspecciona el repositorio completo.
- Detecta qué existe, qué funciona, qué está incompleto y qué puede reutilizarse.
- No borres trabajo existente útil.
- No sustituyas una solución funcional por otra inferior sin una justificación técnica.
- Verifica las versiones estables actuales y la compatibilidad real de las dependencias usando documentación oficial.
- Registra las decisiones importantes en archivos del proyecto para no depender de la memoria del chat.
- Trabaja directamente sobre los archivos; evita pegar archivos completos en la conversación salvo que sea indispensable.

---

# 1. REGLAS ABSOLUTAS DE TRABAJO

## 1.1 Regla de fases y `LUZ VERDE`

El desarrollo se divide en **exactamente cuatro fases**.

Al terminar una fase:

1. Detente por completo.
2. Explica de manera breve qué quedó implementado.
3. Entrega **exactamente tres validaciones manuales**, no dos, no cuatro y no más de tres.
4. Cada validación debe indicar:
   - Qué debe abrir o ejecutar el usuario.
   - Qué acción concreta debe realizar.
   - Qué resultado correcto debe observar.
   - Qué información debe enviarte si algo falla.
5. Espera la respuesta del usuario.
6. No inicies la fase siguiente hasta que el usuario escriba explícitamente `LUZ VERDE`.

Reglas adicionales:

- La frase se considera válida aunque el usuario use minúsculas, pero debe expresar claramente que autoriza avanzar.
- Si el usuario solicita cambios y no escribe `LUZ VERDE`, permanece en la fase actual.
- Después de corregir cambios, vuelve a entregar exactamente tres validaciones actualizadas y vuelve a detenerte.
- No interpretes frases como “está bien”, “continúa”, “dale”, “sigue” o “perfecto” como autorización automática si no contienen `LUZ VERDE`.
- Si el usuario escribe `LUZ VERDE` junto con correcciones pendientes, primero realiza o aclara las correcciones de la fase actual y no avances hasta que la aprobación sea inequívoca.
- Nunca trabajes en dos fases a la vez para aparentar progreso.
- No adelantes código de una fase posterior si eso dificulta validar la fase actual. Sí puedes crear interfaces, contratos o puntos de extensión cuando sean necesarios para evitar retrabajo.

## 1.2 Ahorro de tokens sin sacrificar calidad

El usuario realizará las validaciones visuales y funcionales manuales. Para ahorrar tokens:

- No repitas esta especificación en tus respuestas.
- No narres cada comando ni cada línea modificada.
- No pegues archivos completos que ya estén guardados en el repositorio.
- Resume cambios por módulo y menciona las rutas principales.
- Usa archivos internos para conservar contexto:
  - `docs/PROJECT_SPEC.md`
  - `docs/ARCHITECTURE.md`
  - `docs/DATA_MODEL.md`
  - `docs/DECISIONS.md`
  - `docs/PHASE_STATUS.md`
  - `docs/ADMIN_GUIDE.md`
  - `docs/DEPLOYMENT.md`
- Actualiza `docs/PHASE_STATUS.md` antes de detenerte en cada fase.
- Ejecuta internamente las comprobaciones automatizadas necesarias, pero reporta solo los resultados relevantes.
- No generes explicaciones extensas cuando puedas implementar directamente.
- Haz preguntas únicamente cuando falte un dato verdaderamente bloqueante y no exista una opción segura o configurable.
- Ante detalles menores no definidos, toma una decisión profesional, hazla configurable y registra la decisión.

## 1.3 Calidad real, no aparente

Está prohibido:

- Declarar algo “terminado” sin haberlo ejecutado o verificado.
- Crear botones que no hagan nada.
- Mostrar métricas inventadas como si fueran reales.
- Usar `setTimeout` para simular integraciones.
- Dejar formularios sin validación.
- Dejar rutas protegidas accesibles sin autenticación.
- Guardar secretos en el repositorio.
- Procesar directamente números de tarjetas.
- Ignorar estados de carga, vacío, error o falta de conexión.
- Dejar `TODO`, `FIXME`, datos falsos o contenido temporal en zonas críticas de producción.
- Ocultar errores con bloques `catch` vacíos.
- Duplicar lógica de negocio entre frontend y backend.
- Hardcodear precios, categorías, barrios, reglas promocionales o métodos de pago que deben administrarse desde el panel.
- Acoplar el dominio a una API o proveedor concreto.
- copiar visualmente a Apple, Dior u otra marca. Solo se pueden usar como referencia de calidad, jerarquía, limpieza y atención al detalle.

Los únicos elementos que pueden quedar como configuración pendiente son:

- Credenciales reales.
- Dominio definitivo.
- Información legal final suministrada por el propietario.
- Fotografías y textos comerciales definitivos que todavía no existan.
- Variables de servicios externos no contratados.

Todo elemento pendiente debe:

- Tener un valor de desarrollo seguro.
- Mostrar instrucciones claras.
- No romper el sistema.
- Estar documentado en `.env.example` o en el panel.
- Nunca fingir que una integración externa está activa.

---

# 2. VISIÓN DEL PRODUCTO

Crear una tienda de lentes de contacto cosméticos que se perciba:

- Premium.
- Moderna.
- Exclusiva.
- Confiable.
- Rápida.
- Muy fácil de entender.
- Visualmente memorable.
- Optimizada para vender desde tráfico de Facebook e Instagram Ads.
- Cómoda en celulares Android de gama baja o media y conexiones móviles modestas.
- Flexible para que el negocio pueda cambiar promociones, secciones, precios, envíos y productos sin depender de un programador.

La experiencia debe combinar:

- La claridad y disciplina visual de un producto premium.
- La facilidad de compra de una aplicación móvil.
- El atractivo editorial de una marca de belleza.
- Microinteracciones sutiles y elegantes.
- Una arquitectura que pueda crecer sin convertirse en un sistema frágil.

## 2.1 Contexto comercial inicial

Información inicial conocida:

- Aproximadamente 50 referencias de lentes cosméticos de colores.
- Aproximadamente 5 referencias adicionales para Halloween.
- Accesorios como:
  - Solución o líquido para lentes.
  - Pinza y aplicador.
  - Estuches y kits configurables.
- Precio inicial de referencia para un par de lentes: **$49.000 COP**.
- Los productos son lentes cosméticos sin fórmula y sin aumento.
- El catálogo debe soportar categorías de color como:
  - Miel o café.
  - Gris.
  - Verde.
  - Azul.
  - Halloween.
  - Nuevas categorías creadas posteriormente.
- El negocio vende principalmente desde Medellín y usa publicidad en Meta.
- El volumen inicial estimado es bajo o medio, pero la arquitectura no debe impedir crecer.
- La tienda debe funcionar correctamente con aproximadamente 200 visitas diarias y entre 50 y 100 pedidos mensuales, sin asumir que ese será el límite futuro.

Todos los nombres, precios, colecciones, categorías y cantidades anteriores son datos iniciales editables, nunca constantes rígidas del código.

---

# 3. OBJETIVOS DE NEGOCIO

El sistema debe ayudar a:

1. Aumentar la conversión desde anuncios.
2. Disminuir el número de pasos para comprar.
3. Aumentar el ticket promedio.
4. Reducir preguntas repetitivas por WhatsApp.
5. Calcular correctamente los envíos y pagos parciales.
6. Facilitar el manejo del catálogo.
7. Permitir campañas rápidas sin modificar código.
8. Medir correctamente el comportamiento del embudo.
9. Mantener una imagen profesional y confiable.
10. Evitar dependencia técnica de una sola infraestructura.

## 3.1 Indicadores que debe poder medir el sistema

Como mínimo:

- Ventas brutas y netas.
- Número de pedidos.
- Ticket promedio.
- Productos y tonos más vendidos.
- Categorías más visitadas.
- Productos añadidos al carrito.
- Inicio de checkout.
- Conversión a compra.
- Uso y ventas atribuidas a cupones.
- Uso y ventas por códigos de creadores de contenido.
- Método de pago elegido.
- Tipo de entrega elegido.
- Pedidos con envío pagado por anticipado.
- Saldo pendiente contra entrega.
- Pedidos por ciudad, barrio o zona.
- Promociones activadas y redimidas.
- Rendimiento de reglas de recompensa.
- Carritos abandonados, respetando consentimiento y privacidad.
- Fuente, campaña y parámetros UTM cuando estén disponibles.
- Calidad y estado de los eventos enviados a Meta.

No muestres datos de analítica si no existe una fuente real. Usa estados vacíos y explica qué falta configurar.

---

# 4. PRINCIPIOS DE EXPERIENCIA DE USUARIO

## 4.1 Compra móvil primero

Diseña primero para una pantalla móvil de ancho reducido. Después adapta a tableta y escritorio.

La experiencia principal debe poder completarse con una sola mano:

- Botones táctiles de tamaño adecuado.
- Textos legibles.
- Controles de cantidad claros.
- Filtros fáciles de abrir y cerrar.
- Carrito lateral o inferior sin sacar al usuario del catálogo.
- CTA principal siempre reconocible.
- Checkout sin pasos innecesarios.
- No exigir creación de cuenta.
- Teclado correcto para teléfono, correo, número y dirección.
- Autocompletado donde sea seguro.
- Resumen de pedido visible antes de confirmar.
- Mensajes de error junto al campo afectado.

## 4.2 Rapidez percibida

Aunque haya operaciones de red:

- Responder inmediatamente con estados visuales.
- Usar skeletons discretos.
- Aplicar actualizaciones optimistas solo cuando sea seguro.
- Evitar pantallas bloqueadas sin explicación.
- Mantener estable el diseño para evitar saltos.
- Precargar únicamente recursos realmente probables.
- No cargar el simulador, editores o gráficas del administrador en la tienda pública.

## 4.3 Claridad

El cliente debe entender siempre:

- Qué está comprando.
- Cuántas unidades agregó.
- Cuál es el precio normal y el precio promocional.
- Qué incluye el producto.
- Cuánto cuesta el envío.
- Qué paga ahora.
- Qué paga al recibir.
- Cuándo puede recibir.
- Qué promoción obtuvo.
- Qué falta para desbloquear un beneficio.
- Qué ocurrirá después de confirmar.

## 4.4 Confianza

Incluir de forma elegante y no invasiva:

- Fotos reales cuando aplique.
- Información sobre cambios de tono según luz, cámara y color natural del iris.
- Aviso de que el simulador es orientativo.
- Información de cuidado e higiene.
- Políticas de envío, cambios, privacidad y términos.
- Datos de contacto y WhatsApp.
- Confirmación clara de pedido.
- Estado de pago verificable.
- Número de pedido.
- Mensajes coherentes; nunca usar urgencia falsa.

---

# 5. DIRECCIÓN VISUAL DE LA TIENDA

## 5.1 Personalidad

La tienda debe sentirse:

- Editorial.
- Elegante.
- Contemporánea.
- Premium, pero cercana.
- Femenina sin caer en clichés infantiles.
- Tecnológica sin parecer una plataforma empresarial fría.
- Limpia, con protagonismo de las fotografías de ojos y lentes.
- Distinta a una plantilla genérica de Shopify.

Usa Apple y Dior únicamente como referencias abstractas para:

- Espaciado.
- Jerarquía.
- precisión.
- uso de imágenes.
- transiciones.
- percepción de calidad.

No copies:

- Composiciones exactas.
- Menús.
- tipografías propietarias.
- textos.
- iconografía.
- animaciones identificables.
- estructura visual de una página concreta.

## 5.2 Sistema de diseño

Crea un sistema propio con:

- Tokens de color semánticos.
- Tipografía principal y secundaria de licencia libre.
- Escala tipográfica fluida.
- Escala de espacios.
- Radios.
- sombras.
- bordes.
- estados interactivos.
- alturas de controles.
- ancho máximo de contenido.
- puntos de quiebre.
- duración y curvas de animación.
- variantes claras de botones, tarjetas, chips y campos.

Dirección cromática inicial:

- Base clara y luminosa.
- Blanco cálido o neutro.
- Negro o carbón para contraste.
- Rojo profundo, cereza, rosa sofisticado o acento de marca bien controlado.
- Grises neutros para información secundaria.
- Colores de estado accesibles.
- El panel puede usar una variante clara o oscura sofisticada, pero debe conservar legibilidad y coherencia.

No abuses de:

- Gradientes.
- neón.
- transparencias.
- glassmorphism.
- sombras enormes.
- bordes brillantes.
- animaciones decorativas.
- fondos ruidosos.

## 5.3 Animaciones

Las animaciones deben:

- Usar principalmente `transform` y `opacity`.
- Ser cortas y responder al estado.
- Reforzar jerarquía o causalidad.
- Respetar `prefers-reduced-motion`.
- Desactivarse o simplificarse en dispositivos lentos cuando sea necesario.
- Evitar parallax pesado.
- Evitar animar grandes filtros o desenfoques.
- No retrasar la compra.
- No bloquear el primer render.
- Cargarse por demanda si requieren una librería.

Ejemplos permitidos:

- Entrada sutil de una sección al hacerse visible.
- Transición del carrito.
- Cambio de cantidad.
- Confirmación de producto agregado.
- Progreso hacia un beneficio.
- Reordenamiento en el editor visual.
- Cambio entre imágenes de producto.
- Microinteracción del botón de compra.

---

# 6. ARQUITECTURA DE INFORMACIÓN PÚBLICA

La tienda debe incluir como mínimo:

1. Inicio.
2. Catálogo completo.
3. Página de categoría.
4. Página de colección.
5. Resultados de búsqueda.
6. Página individual de producto.
7. Favoritos.
8. Carrito.
9. Checkout.
10. Confirmación de pedido.
11. Consulta básica de pedido mediante número y dato de verificación.
12. Preguntas frecuentes.
13. Cuidados y guía de uso.
14. Envíos y entregas.
15. Políticas de cambios o devoluciones.
16. Política de privacidad.
17. Términos y condiciones.
18. Página de contacto o ayuda.
19. Páginas editoriales creadas desde el panel.
20. Página 404 útil.
21. Página de error recuperable.
22. Estado de mantenimiento configurable sin bloquear el acceso administrativo.

Las rutas deben ser claras, legibles y optimizadas para SEO.

---

# 7. PÁGINA DE INICIO

La página de inicio debe construirse con el editor visual administrable y aceptar, entre otros, los siguientes bloques:

- Barra de anuncios.
- Hero principal.
- Hero dividido.
- Banner promocional.
- Imagen con texto.
- Video ligero con poster.
- Categorías destacadas.
- Colecciones destacadas.
- Más vendidos.
- Novedades.
- Tonos por color.
- Recomendaciones.
- Productos en promoción.
- Beneficios de compra.
- Contador de campaña real, solo cuando exista fecha final verdadera.
- Testimonios.
- Galería social o contenido de clientes con permisos.
- Preguntas frecuentes.
- CTA hacia WhatsApp.
- Sección editorial.
- Comparador de tonos.
- Bloque de confianza.
- Separador.
- Espaciador con límites seguros.

Una configuración inicial sugerida, que Claude puede mejorar, es:

1. Barra informativa compacta.
2. Hero con propuesta clara y CTA al catálogo.
3. Accesos rápidos por familias de color.
4. Colección de más vendidos.
5. Banner de oferta o beneficio actual.
6. Explicación visual de cómo elegir un tono.
7. Productos nuevos o destacados.
8. Beneficios y logística.
9. Testimonios.
10. FAQ breve.
11. CTA final y pie de página.

El diseño final debe ser decidido profesionalmente por Claude tras revisar las imágenes y activos disponibles. No debe limitarse mecánicamente a esta sugerencia.

---

# 8. CATÁLOGO, BÚSQUEDA Y FILTROS

## 8.1 Catálogo

Debe soportar:

- Vista en cuadrícula responsive.
- Fotografías optimizadas.
- Varias relaciones de aspecto sin deformación.
- Paginación o carga progresiva accesible.
- Ordenar por:
  - Relevancia.
  - Más vendidos.
  - Novedades.
  - Precio ascendente.
  - Precio descendente.
  - Promoción.
- Filtros por:
  - Categoría.
  - Subcategoría.
  - Familia de color.
  - Colección.
  - Disponibilidad.
  - Precio.
  - Promoción.
  - Atributos futuros configurables.
- Chips de filtros activos.
- Botón para limpiar filtros.
- Conteo de resultados.
- Estado sin resultados con recomendaciones útiles.
- Estado de carga.
- Recuperación ante error.
- URL compartible que conserve filtros y orden cuando sea razonable.
- Búsqueda tolerante a mayúsculas, tildes y pequeñas variaciones.
- Sinónimos administrables si el motor de búsqueda lo permite.

## 8.2 Tarjeta de producto

Cada tarjeta debe poder mostrar:

- Imagen principal.
- Imagen secundaria al interactuar en dispositivos compatibles, sin depender del hover.
- Nombre.
- Precio normal.
- Precio promocional.
- Porcentaje o ahorro, solo cuando sea real.
- Etiqueta configurable: nuevo, más vendido, promoción, Halloween, agotado, etc.
- Estado de inventario.
- Familia de color.
- Botón de favoritos.
- CTA de agregar.
- Selector de cantidad `− / cantidad / +` directamente en la tarjeta.
- Confirmación visual al agregar.
- Acceso a detalles.
- Accesibilidad completa mediante teclado y lector de pantalla.

Comportamiento de cantidad:

- Cuando la cantidad en carrito sea cero, mostrar “Agregar” o un botón equivalente.
- Después de agregar, convertir el control en un stepper claro.
- El botón `−` en cantidad uno debe poder llevar a cero o mostrar una acción de eliminar comprensible.
- Respetar inventario máximo.
- Evitar dobles envíos por taps rápidos.
- Sincronizar la misma cantidad entre tarjeta, producto, carrito y checkout.

## 8.3 Categorías y subcategorías

El administrador debe poder:

- Crear categorías.
- Editarlas.
- archivarlas.
- reordenarlas.
- asignar imagen.
- asignar icono opcional.
- definir nombre, slug y descripción SEO.
- establecer una categoría padre.
- convertir una categoría en subcategoría.
- moverla dentro del árbol.
- ocultarla sin eliminar productos.
- crear nuevas familias de color.
- evitar ciclos en la jerarquía.
- controlar su aparición en menú, filtros e inicio.

La arquitectura no debe hardcodear “miel”, “gris”, “verde” o “azul”. Deben existir como datos iniciales editables.

---

# 9. PÁGINA DE PRODUCTO

Debe incluir:

- Galería optimizada.
- Zoom accesible.
- Nombre.
- Precio.
- Precio anterior si existe descuento real.
- Inventario o disponibilidad.
- Selector de cantidad.
- CTA principal.
- CTA de WhatsApp opcional.
- Información de qué incluye.
- Descripción corta.
- Descripción detallada.
- Familia de color.
- Especificaciones configurables.
- Recomendaciones de cuidado.
- Aclaración de variaciones por iluminación y color natural del ojo.
- Badge de fotografía real si está verificado.
- Accesorios sugeridos.
- Productos relacionados.
- Productos frecuentemente comprados juntos.
- Barra o tarjeta de progreso hacia una recompensa.
- Información de envío calculable o acceso directo al cálculo.
- Métodos de pago disponibles.
- Migas de pan.
- Datos estructurados de producto.
- Estados para agotado, próximo lanzamiento y producto archivado.
- CTA fijo inferior en móvil cuando sea útil y no invada contenido.

No uses textos médicos engañosos. No prometas que un tono se verá idéntico en todas las personas.

---

# 10. FAVORITOS

Crear una lista de deseos usable sin iniciar sesión:

- Persistencia local con estrategia segura.
- Sincronización futura preparada para cuenta de usuario.
- Agregar o quitar desde tarjeta y producto.
- Página de favoritos.
- Estado vacío útil.
- Acción de agregar al carrito.
- Control de productos agotados o archivados.
- No obligar a aceptar marketing para usar favoritos.

---

# 11. CARRITO

## 11.1 Experiencia

Implementar:

- Carrito lateral en escritorio.
- Drawer o panel inferior adecuado en móvil.
- Página de carrito completa como respaldo.
- Persistencia entre sesiones.
- Actualización inmediata de cantidades.
- Eliminación con opción de deshacer.
- Resumen de:
  - Subtotal.
  - Descuentos.
  - Regalos.
  - Envío estimado o pendiente por calcular.
  - Total.
  - Pago anticipado.
  - Saldo contra entrega.
- Campo de cupón.
- Recomendaciones de accesorios.
- Frecuentemente comprados juntos.
- Barra de progreso hacia beneficio.
- CTA a checkout.
- CTA para enviar el carrito por WhatsApp.
- Advertencia si un producto cambió de precio o inventario.
- Revalidación del carrito en servidor antes de crear el pedido.
- Manejo de carritos antiguos o productos eliminados.

## 11.2 Upselling y cross-selling

Los accesorios iniciales sugeridos son:

- Líquido o solución.
- Pinza y aplicador.
- Kits o estuches configurables.

El administrador debe poder configurar por producto, categoría o globalmente:

- Productos complementarios.
- Orden de recomendación.
- Texto promocional.
- Imagen.
- Regla de visibilidad.
- Límite de sugerencias.
- Fechas.
- Dispositivo.
- Exclusiones.
- Si se muestra en tarjeta, producto, carrito o checkout.

No agregues productos automáticamente sin consentimiento, excepto regalos gratuitos que cumplan una regla y estén claramente identificados.

---

# 12. BARRA DE PROGRESO Y RECOMPENSAS

Crear un motor configurable para aumentar el ticket promedio.

Debe permitir reglas como:

- Envío gratis al superar un monto.
- Producto gratuito al superar un monto.
- Líquido gratuito.
- Lente adicional.
- Descuento fijo.
- Descuento porcentual.
- Regalo específico.
- Beneficio por cantidad de productos.
- Beneficio por combinación de productos.
- Beneficio por categoría.
- Beneficio por zona.
- Beneficio durante una campaña.

Configuración requerida:

- Nombre interno.
- Mensaje antes de completar.
- Mensaje de progreso con monto faltante.
- Mensaje de beneficio desbloqueado.
- Tipo de condición.
- Valor objetivo.
- Productos o categorías elegibles.
- Tipo de recompensa.
- Recompensa.
- Prioridad.
- Acumulable o no.
- Fecha de inicio y fin.
- Límite total.
- Límite por cliente cuando exista identificación.
- Métodos de envío válidos.
- Métodos de pago válidos.
- Estado.
- Vista previa.

Comportamiento:

- Recalcular en cliente para respuesta inmediata.
- Verificar en servidor antes de confirmar.
- Aplicar de forma determinista.
- Explicar qué regla ganó si existen conflictos.
- Nunca permitir totales negativos.
- Evitar doble regalo por reintentos.
- Registrar la promoción aplicada en el pedido.
- Mostrar en el administrador el costo y uso de la recompensa.

---

# 13. CUPONES Y CÓDIGOS DE CREADORES

El sistema debe permitir:

- Código manual personalizado.
- Código autogenerado.
- Descuento fijo.
- Descuento porcentual.
- Envío gratis.
- Regalo.
- Fecha y hora de inicio.
- Fecha y hora de fin.
- Límite de usos total.
- Límite por cliente.
- Compra mínima.
- Cantidad mínima.
- Productos incluidos.
- Productos excluidos.
- Categorías incluidas.
- Categorías excluidas.
- Zonas válidas.
- Métodos de pago válidos.
- Primer pedido únicamente.
- Acumulable o exclusivo.
- Prioridad.
- Estado borrador, programado, activo, pausado, expirado.
- Enlace con cupón aplicado.
- Atribución a creador, campaña o socio.
- Etiquetas internas.
- Notas internas.

Analítica:

- Usos.
- Pedidos.
- Ventas brutas.
- Descuento concedido.
- Ventas netas.
- Ticket promedio.
- Tasa de conversión cuando los datos lo permitan.
- Productos vendidos.
- Periodo.
- Exportación.

Seguridad:

- Validar siempre en servidor.
- Normalizar mayúsculas y espacios.
- Evitar carreras en límites de uso.
- No revelar reglas internas sensibles.
- Conservar evidencia del cupón aplicado en cada pedido.

---

# 14. POP-UPS Y CAMPAÑAS

El administrador debe poder crear pop-ups y banners promocionales con:

- Imagen para móvil.
- Imagen para escritorio.
- Título.
- Texto.
- Botón.
- URL o destino interno.
- Cupón opcional.
- Fecha de inicio y fin.
- Páginas incluidas.
- Páginas excluidas.
- Frecuencia:
  - Una vez por sesión.
  - Una vez por periodo.
  - Siempre, con protección contra abuso.
- Retardo.
- Activación por scroll.
- Activación por intención de salida solo en dispositivos compatibles.
- Segmentación por UTM.
- Segmentación por carrito.
- Segmentación por dispositivo.
- Prioridad.
- Estado.
- Vista previa.

Reglas UX:

- Cierre evidente.
- No bloquear contenido esencial.
- No abrir inmediatamente si perjudica la carga.
- No mostrar múltiples pop-ups al mismo tiempo.
- Recordar cierre según consentimiento y configuración.
- Ser accesible mediante teclado.
- No usar patrones engañosos.
- No mostrar una campaña expirada.
- Medir impresiones, cierres, clics y conversiones cuando exista consentimiento.

---

# 15. EDITOR VISUAL NO-CODE

## 15.1 Enfoque

Crear un constructor por secciones, no un lienzo totalmente libre.

El administrador podrá:

- Añadir bloques.
- Duplicarlos.
- ocultarlos.
- eliminarlos.
- arrastrarlos para cambiar el orden.
- editarlos.
- previsualizarlos.
- publicarlos.
- guardar borradores.
- programarlos.
- definir visibilidad por dispositivo.
- crear plantillas de campaña.

Esta restricción por bloques es intencional: debe dar flexibilidad sin permitir diseños rotos o inconsistentes.

## 15.2 Bloques

Como mínimo:

- Barra de anuncio.
- Hero.
- Hero con dos columnas.
- Banner.
- Imagen y texto.
- Carrusel de productos.
- Cuadrícula de productos.
- Colecciones.
- Categorías.
- Más vendidos.
- Novedades.
- Testimonios.
- FAQ.
- Beneficios.
- Video.
- Galería.
- CTA.
- Texto editorial.
- HTML enriquecido sanitizado, solo si es indispensable y con permisos restringidos.
- Separador.
- Espaciador.
- Formulario o captura de contacto configurable.
- Botón de WhatsApp.
- Sección de promoción.

## 15.3 Propiedades comunes

Cada bloque puede tener:

- Identificador estable.
- Nombre interno.
- Estado borrador/publicado.
- Orden.
- ancho.
- alineación.
- espaciado superior e inferior dentro de límites.
- color de fondo.
- imagen de fondo.
- overlay.
- contenido.
- CTA.
- enlace interno o externo.
- apertura en misma o nueva pestaña.
- texto alternativo.
- programación.
- visibilidad móvil/escritorio.
- condición UTM opcional.
- condición de campaña.
- variante visual predefinida.

## 15.4 Publicación segura

Implementar:

- Borrador separado de versión publicada.
- Vista previa mediante URL segura.
- Publicación explícita.
- Historial básico de versiones.
- Restauración de versión anterior.
- Validación antes de publicar.
- Protección ante bloques incompletos.
- Reordenamiento accesible además del drag-and-drop.
- Prevención de enlaces inválidos.
- Sanitización de contenido.
- Optimización de imágenes.
- No permitir CSS o JavaScript arbitrario en roles comunes.

## 15.5 Plantillas

Permitir plantillas como:

- Base.
- Halloween.
- Día de la Madre.
- Amor y amistad.
- Lanzamiento.
- Promoción relámpago.
- Temporada navideña.

Las plantillas deben copiar configuraciones a un nuevo borrador, no sobrescribir una página publicada sin confirmación.

---

# 16. CHECKOUT

## 16.1 Principios

- Compra como invitado.
- Máxima claridad.
- Mínima fricción.
- Sin crear cuenta obligatoria.
- Validaciones inmediatas.
- Datos sensibles mínimos.
- Cálculo del pedido en servidor.
- Recuperación ante pago pendiente o regreso desde Mercado Pago.
- Diseño móvil primero.
- Persistencia temporal segura.
- Consentimiento diferenciado para términos y marketing.

## 16.2 Datos mínimos

Configurable, pero inicialmente:

- Nombre completo.
- Teléfono.
- Correo electrónico.
- Departamento.
- Ciudad o municipio.
- Barrio o sector.
- Dirección.
- Apartamento, torre, bloque o complemento.
- Indicaciones de entrega.
- Documento únicamente cuando lo requiera legalmente el método de pago o facturación.
- Método de entrega.
- Método de pago.
- Aceptación de términos y privacidad.
- Consentimiento de marketing separado y opcional.

## 16.3 Flujo sugerido

1. Contacto.
2. Ubicación y entrega.
3. Pago.
4. Revisión.
5. Confirmación.

Claude puede convertirlo en una sola página progresiva si demuestra que es más claro en móvil. La interfaz no debe ocultar qué se paga ahora y qué se paga después.

## 16.4 Resumen financiero obligatorio

Mostrar de forma explícita:

- Productos.
- Subtotal.
- Descuentos.
- Regalos.
- Valor del envío.
- Total del pedido.
- **Pagar ahora**.
- **Pagar al recibir**.
- Método seleccionado.
- Fecha o rango de entrega estimado.
- Mensaje específico de la zona.

Ejemplo conceptual:

- Productos: $49.000
- Envío: $13.000
- Pagar ahora: $13.000
- Pagar al recibir: $49.000
- Total del pedido: $62.000

Nunca confundas el pago anticipado con un descuento.

---

# 17. MOTOR DE ENVÍOS Y ZONAS

## 17.1 Modelo jerárquico

Crear reglas con jerarquía:

1. País.
2. Departamento.
3. Ciudad o municipio.
4. Barrio o sector.
5. Regla específica o excepción.

La regla más específica válida debe prevalecer.

Ejemplo:

- Antioquia tiene una tarifa predeterminada.
- Medellín tiene otra tarifa.
- Un barrio de Medellín tiene una excepción.
- La excepción del barrio prevalece.
- Si no existe excepción, usa ciudad.
- Si no existe ciudad, usa departamento.
- Si no existe ninguna regla aplicable, el checkout no debe inventar una tarifa: debe mostrar “cotización requerida” o el comportamiento configurado.

## 17.2 Configuración por zona

Cada zona o regla puede definir:

- Nombre interno.
- País.
- departamento.
- ciudad.
- barrio o sector.
- código opcional.
- tarifa fija.
- tarifa gratuita.
- umbral de envío gratis.
- método disponible.
- mismo día.
- fecha estimada.
- días hábiles mínimos y máximos.
- hora límite.
- días de operación.
- contra entrega.
- pago total anticipado.
- solo envío anticipado.
- porcentaje o monto de anticipo.
- saldo contra entrega.
- recargo.
- compra mínima.
- compra máxima.
- productos excluidos.
- mensaje al cliente.
- instrucciones internas.
- prioridad.
- estado.
- fechas de vigencia.

## 17.3 Medellín y Área Metropolitana

Debe ser posible configurar:

- Medellín.
- Bello.
- Envigado.
- Itagüí.
- Sabaneta.
- La Estrella.
- Otros municipios.
- Barrios o sectores personalizados.
- Tarifas distintas por barrio.
- Entrega el mismo día.
- Hora límite para pedir.
- Disponibilidad de contra entrega total.
- Excepciones de cobertura.
- Días sin servicio.
- Recargos por sectores.

La lista anterior es inicial y editable.

## 17.4 Otras ciudades

Debe soportar el flujo:

- El cliente paga el costo de envío por anticipado.
- El valor de los productos queda como saldo contra entrega.
- También puede existir pago total anticipado.
- El sistema registra por separado:
  - Total.
  - Monto anticipado.
  - Monto pagado.
  - Saldo pendiente.
  - Motivo del anticipo.
- La orden no pasa a preparación si el anticipo obligatorio no está aprobado.
- El administrador puede marcar manualmente una transferencia verificada con registro de auditoría.
- No marcar un pago como aprobado solo por recibir una captura.

## 17.5 Gestión de ubicaciones

El panel debe permitir:

- Importar departamentos y municipios.
- Crear barrios.
- editar.
- buscar.
- activar o desactivar.
- duplicar reglas.
- aplicar una tarifa a todo un departamento.
- sobrescribir una ciudad.
- sobrescribir un barrio.
- probar una dirección simulada.
- ver qué regla ganó y por qué.
- detectar reglas solapadas.
- exportar.
- programar cambios de tarifa.

No dependas obligatoriamente de una API externa para calcular tarifas. El sistema administrativo es la fuente inicial.

---

# 18. MÉTODOS DE PAGO

## 18.1 Métodos iniciales

1. Mercado Pago.
2. Contra entrega total donde esté permitido.
3. Pago anticipado del envío y saldo contra entrega.
4. Transferencia o QR manual configurable.
5. Pago total anticipado por transferencia.
6. Nuevos métodos mediante adaptadores futuros.

## 18.2 Mercado Pago

Implementar con la solución oficial vigente y estable para Colombia, seleccionada tras revisar la documentación oficial actual.

Requisitos:

- Entorno de pruebas y producción separados.
- Credenciales en variables de entorno o almacén seguro.
- Tokenización o componentes oficiales.
- Nunca recibir ni guardar número completo de tarjeta, CVV o datos PCI.
- Crear la intención u orden desde backend.
- Usar idempotencia.
- Asociar el pago con un `external_reference` estable.
- Validar montos en servidor.
- Webhooks firmados o verificados según documentación vigente.
- Procesar webhooks de forma idempotente.
- No confiar en parámetros de retorno del navegador como confirmación definitiva.
- Registrar estados.
- Soportar aprobado, pendiente, rechazado, cancelado, reembolsado y contracargo cuando la API los exponga.
- Página de retorno clara.
- Reconciliación administrativa.
- Registro técnico de errores sin exponer secretos.
- Botón de reintento seguro.
- Pruebas con credenciales y usuarios de prueba.
- Documentar los pasos exactos para colocar credenciales reales.

Si la API oficial vigente ofrece varias modalidades:

- Elige la que proporcione buena conversión, seguridad y mantenimiento.
- Prioriza componentes oficiales.
- Evita construir formularios de tarjeta manuales.
- No uses una integración obsoleta.
- Encapsula Mercado Pago detrás de `PaymentProvider`.

## 18.3 Pago parcial

El motor de pagos debe soportar:

- `amount_total`.
- `amount_due_now`.
- `amount_paid`.
- `amount_due_on_delivery`.
- `payment_reason`.
- Varias transacciones por pedido.
- Un pago de envío.
- Pago posterior del saldo.
- Reembolsos parciales.
- Ajustes administrativos auditados.
- Estado calculado y no editado arbitrariamente.

Estados sugeridos:

- Sin pago.
- Anticipo pendiente.
- Anticipo aprobado.
- Pago total pendiente.
- Pagado.
- Parcialmente pagado.
- Rechazado.
- Reembolsado parcialmente.
- Reembolsado.
- Disputado.

## 18.4 Transferencias manuales

Permitir configurar:

- Banco o entidad.
- Tipo de cuenta.
- Número enmascarado en UI pública según necesidad.
- Titular.
- Documento.
- QR.
- Instrucciones.
- Tiempo de validación.
- Archivo de comprobante.
- Referencia.
- Estado pendiente, aprobado o rechazado.
- Motivo del rechazo.
- Usuario administrador que verificó.
- Fecha de verificación.

El sistema debe dejar claro que un comprobante enviado no equivale automáticamente a un pago aprobado.

---

# 19. PEDIDOS

## 19.1 Ciclo de vida

Estados configurables con una base inicial:

- Borrador.
- Pendiente de pago.
- Pago parcial requerido.
- Pago en revisión.
- Confirmado.
- En preparación.
- Listo para despacho.
- Despachado.
- En camino.
- Entregado.
- Cancelado.
- Devuelto.
- Reembolsado.
- Incidencia.

No mezcles estado de pedido, pago y envío. Deben ser campos relacionados pero separados.

## 19.2 Pedido

Guardar una instantánea de:

- Productos.
- nombres.
- SKU.
- cantidades.
- precios.
- descuentos.
- impuestos si aplican.
- regalos.
- promociones.
- cupón.
- datos de cliente.
- dirección.
- regla de envío aplicada.
- tarifa.
- método.
- pago anticipado.
- saldo.
- fuente UTM.
- consentimiento.
- notas.
- versión de términos aceptada.
- eventos importantes.

Un cambio posterior en el catálogo no debe alterar pedidos históricos.

## 19.3 Administración de pedidos

El panel debe incluir:

- Tabla con filtros.
- búsqueda.
- estados.
- rangos de fecha.
- ciudad.
- barrio.
- método de entrega.
- pago.
- cupón.
- UTM.
- creador.
- exportación CSV.
- vista detallada.
- línea de tiempo.
- notas internas.
- cambio de estado.
- registro de pago.
- impresión o vista de preparación.
- copia de resumen para WhatsApp.
- datos de saldo contra entrega.
- historial de cambios.
- detección de pedidos duplicados.
- acción de cancelar con motivo.
- reembolso mediante proveedor cuando esté soportado.
- acciones masivas seguras.

## 19.4 Inventario

Debe existir:

- Stock por producto o variante.
- Stock disponible.
- Stock reservado.
- Stock vendido.
- Movimientos de inventario.
- Ajuste manual con motivo.
- Umbral de stock bajo.
- Política de venta sin stock configurable.
- Liberación de reserva si expira el checkout o falla el pago.
- Prevención de sobreventa mediante transacción o mecanismo equivalente.
- Historial auditable.
- Importación y exportación.

---

# 20. WHATSAPP

## 20.1 Botón flotante

Debe existir un botón flotante:

- Visible sin invadir CTA críticos.
- Posición segura en móvil.
- Configurable desde el panel.
- Número configurable.
- Horario.
- mensaje predeterminado.
- activación por página.
- evento de analítica.
- accesible.

## 20.2 WhatsApp desde el carrito

Generar un mensaje legible con:

- Saludo.
- productos.
- cantidades.
- subtotal.
- promociones.
- ubicación seleccionada si existe.
- envío estimado.
- total.
- pago anticipado.
- saldo contra entrega.
- cupón.
- identificador temporal de carrito si es seguro.
- URL para recuperar el carrito, si se implementa con token seguro y expiración.

Ejemplo de estructura, no texto rígido:

```
Hola, quiero realizar este pedido:

• 1 × [Producto]
• 1 × [Accesorio]

Subtotal: $...
Envío: $...
Pagar ahora: $...
Pagar al recibir: $...
Total: $...

Ciudad: ...
Barrio: ...
```

Reglas:

- Codificar correctamente la URL.
- No incluir secretos.
- No poner datos personales sin consentimiento.
- No permitir manipular el total enviado como si fuera una orden confirmada.
- Identificar el mensaje como resumen de carrito, no pedido pagado.
- El administrador debe poder editar la plantilla con variables permitidas.

---

# 21. META PIXEL Y API DE CONVERSIONES

Implementar Meta Pixel más Conversions API mediante un módulo de analítica desacoplado.

## 21.1 Configuración

Desde el panel o variables seguras:

- Pixel ID.
- token de Conversions API.
- versión de API configurable o actualizable.
- test event code.
- dominio.
- estado de integración.
- modo prueba.
- consentimiento requerido.
- registro de últimos eventos.
- diagnóstico sin mostrar tokens.

Los secretos solo deben estar en backend.

## 21.2 Eventos

Como mínimo:

- `PageView`.
- `ViewContent`.
- `Search`.
- `AddToWishlist`.
- `AddToCart`.
- `InitiateCheckout`.
- `AddPaymentInfo`.
- `Purchase`.
- Eventos personalizados únicamente si tienen un objetivo claro.

Datos cuando correspondan:

- content IDs estables.
- content type.
- nombre.
- categoría.
- cantidad.
- valor.
- moneda `COP`.
- order ID.
- fuente URL.
- client user agent.
- datos permitidos y normalizados.
- parámetros UTM.
- `event_id`.

## 21.3 Duplicación y privacidad

- Enviar los eventos críticos desde navegador y servidor cuando corresponda.
- Usar el mismo `event_id` para deduplicación.
- No enviar `Purchase` desde el navegador como verdad definitiva antes de la confirmación del backend.
- Enviar compra del servidor cuando el pedido o pago alcance el estado definido.
- Respetar consentimiento.
- Hashear datos personales según la documentación oficial antes de enviarlos.
- Minimizar datos.
- Documentar el fundamento de cada dato.
- Permitir desactivar la integración.
- Evitar doble evento por recargas, reintentos o webhooks duplicados.
- Crear un registro de eventos con retención razonable y sin secretos.

## 21.4 UTM

Capturar:

- `utm_source`.
- `utm_medium`.
- `utm_campaign`.
- `utm_content`.
- `utm_term`.
- identificadores publicitarios permitidos.
- primera atribución.
- última atribución.

Conservarlos en carrito y pedido con límites de tiempo claros. No sobrescribir indiscriminadamente la primera fuente.

---

# 22. PANEL ADMINISTRATIVO

## 22.1 Dirección visual

El panel debe ser:

- Profesional.
- minimalista.
- moderno.
- limpio.
- ligeramente futurista.
- denso donde conviene, pero no abrumador.
- rápido.
- responsive, con prioridad escritorio y buena operación en tableta.
- consistente con la marca sin sacrificar productividad.

Componentes esperados:

- Barra lateral.
- encabezado.
- buscador global.
- command palette opcional.
- breadcrumbs.
- tablas.
- filtros.
- tabs.
- formularios.
- drawers.
- modales.
- tooltips.
- estados de guardado.
- toasts.
- confirmaciones.
- atajos seguros.
- ayuda contextual.

Cada control poco obvio debe tener tooltip o texto de ayuda.

## 22.2 Inicio del administrador

Mostrar datos reales:

- Ventas.
- pedidos.
- ticket promedio.
- pedidos pendientes.
- anticipos pendientes.
- entregas pendientes.
- productos con stock bajo.
- cupones principales.
- ventas por ciudad.
- productos principales.
- actividad reciente.
- accesos rápidos.

Debe permitir filtros de fecha y comparaciones. Cuando no existan datos, mostrar estados vacíos útiles.

## 22.3 Navegación sugerida

- Resumen.
- Pedidos.
- Productos.
- Inventario.
- Categorías.
- Colecciones.
- Clientes.
- Envíos y zonas.
- Pagos.
- Promociones.
- Cupones.
- Recompensas.
- Pop-ups.
- Editor visual.
- Contenido.
- Analítica.
- Integraciones.
- Usuarios y roles.
- Auditoría.
- Configuración.

Claude puede ajustar agrupaciones para mejorar usabilidad.

---

# 23. GESTIÓN DE PRODUCTOS

## 23.1 Producto

Campos iniciales:

- ID.
- nombre.
- slug.
- SKU.
- estado.
- descripción corta.
- descripción completa.
- precio.
- precio promocional.
- fecha de promoción.
- costo interno opcional.
- stock.
- stock bajo.
- permitir venta sin stock.
- categorías.
- colección.
- familia de color.
- etiquetas.
- atributos.
- imágenes.
- video.
- imagen para compartir.
- producto destacado.
- más vendido manual o calculado.
- productos relacionados.
- accesorios sugeridos.
- reglas de upsell.
- información de cuidado.
- especificaciones.
- peso y dimensiones para logística futura.
- SEO.
- textura para simulador.
- orden.
- fecha de publicación.
- archivado.

Los precios COP deben almacenarse como enteros en la unidad mínima usada por el negocio y formatearse como `$49.000`, evitando errores de punto flotante.

## 23.2 Carga masiva por nombres separados por comas

Crear una herramienta donde el administrador pueda pegar:

```
Amazon Brown, Brown Hazel, Oslo, Boreal, Santorini
```

Al procesar:

- Separar por comas y saltos de línea.
- Limpiar espacios.
- Detectar duplicados.
- Mostrar advertencias.
- Crear una tarjeta de borrador por nombre.
- Generar slug editable.
- Permitir editar cada tarjeta.
- Permitir aplicar valores globales.
- Permitir asignar categoría a todos.
- Permitir asignar precio a todos.
- Permitir subir imágenes por tarjeta.
- Permitir arrastrar imágenes.
- Permitir descripción individual.
- Permitir precio promocional individual.
- Permitir SKU.
- Permitir stock.
- Permitir excluir una tarjeta.
- Validar antes de guardar.
- Guardar todos en una transacción o reportar claramente los fallos parciales.
- No publicar automáticamente salvo elección explícita.

## 23.3 Importación CSV

Además, permitir:

- Descargar plantilla.
- Mapear columnas.
- Vista previa.
- validar filas.
- mostrar errores por fila.
- actualizar productos existentes por SKU o ID.
- modo crear únicamente.
- modo actualizar.
- modo crear o actualizar.
- exportar resultado.
- no sobrescribir campos vacíos sin confirmación.
- procesar imágenes mediante URL solo con validaciones y protección SSRF.
- límites de tamaño.

## 23.4 Medios

- Carga múltiple.
- Reordenamiento.
- recorte no destructivo.
- texto alternativo.
- compresión.
- formatos modernos.
- miniaturas.
- eliminación segura.
- detección de archivo duplicado.
- límites.
- validación MIME real.
- URLs firmadas para administración cuando corresponda.
- almacenamiento mediante interfaz S3-compatible.
- R2 como adaptador inicial posible.
- alternativa local en desarrollo.
- posibilidad futura de migrar a otro almacenamiento S3-compatible.

---

# 24. COLECCIONES Y RECOMENDACIONES

Las colecciones pueden ser:

- Manuales.
- dinámicas por reglas.
- programadas.
- destacadas.

Ejemplos:

- Más vendidos.
- Nuevos.
- Halloween.
- Tonos miel.
- Favoritos de clientes.
- Promoción actual.

Reglas posibles:

- Categoría.
- etiqueta.
- precio.
- stock.
- fecha.
- ventas.
- creación manual.

Las recomendaciones deben poder definirse:

- Globalmente.
- por categoría.
- por producto.
- por carrito.
- por colección.
- por regla.

La prioridad debe ser determinista y visible en el panel.

---

# 25. CONTENIDO Y CONFIGURACIÓN GENERAL

El administrador debe poder editar:

- Nombre de marca.
- logo.
- favicon.
- colores de marca dentro de límites seguros.
- información de contacto.
- WhatsApp.
- redes sociales.
- horarios.
- mensajes de entrega.
- pie de página.
- menú.
- enlaces.
- páginas.
- FAQ.
- cuidados.
- avisos.
- políticas.
- textos del checkout.
- SEO global.
- datos para compartir.
- mantenimiento.
- notificaciones.

Usar un editor de texto enriquecido seguro, con sanitización y opciones limitadas a contenido útil.

---

# 26. CLIENTES

Sin obligar al usuario a crear cuenta, registrar una ficha de cliente cuando exista pedido:

- Nombre.
- teléfono.
- correo.
- direcciones.
- pedidos.
- valor total.
- ticket promedio.
- primera compra.
- última compra.
- cupones usados.
- consentimiento.
- notas internas.
- etiquetas.
- bloqueos justificados.
- historial de cambios.

Crear una estrategia de deduplicación prudente. No fusionar clientes automáticamente si existe riesgo de confundir personas.

---

# 27. SIMULADOR DE LENTES CON FOTO

Esta función se implementa al final, en la fase 4, sin perjudicar el lanzamiento del e-commerce.

## 27.1 Alcance

No hacer video en tiempo real como primera implementación. Crear una simulación sobre fotografía guiada.

Flujo:

1. Explicar requisitos de foto.
2. Solicitar permiso.
3. Tomar o subir foto frontal.
4. Validar de forma orientativa:
   - rostro de frente.
   - ojos visibles.
   - iluminación suficiente.
   - sin gafas oscuras.
   - resolución mínima.
5. Detectar rostro, ojos, pupilas e iris mediante una librería actual, mantenida y compatible con navegador.
6. Aplicar la textura del lente.
7. Ajustar escala, rotación y perspectiva.
8. Preservar pupila, párpados, brillos y oclusiones en la medida técnicamente viable.
9. Permitir cambiar de tono.
10. Mostrar antes y después.
11. Agregar el tono al carrito.
12. Permitir eliminar la foto.

## 27.2 Privacidad

Preferir procesamiento local en navegador cuando sea viable.

Si se necesita servidor:

- Pedir consentimiento explícito.
- Explicar finalidad.
- Usar almacenamiento temporal.
- Eliminar automáticamente.
- No usar fotos para entrenamiento.
- No guardar por defecto.
- Permitir eliminación inmediata.
- No enviar a terceros sin informar.
- Registrar consentimiento.
- Nunca incluir la foto en analítica.

## 27.3 Texturas

Cada producto puede tener:

- Textura circular transparente.
- máscara.
- tamaño base.
- opacidad recomendada.
- modo de mezcla.
- corrección de color.
- configuración por ojo si fuera necesario.
- estado de revisión.

Crear una herramienta administrativa asistida para recortar y preparar la textura a partir de una imagen, pero permitir siempre subir una textura PNG/WebP transparente ya preparada.

## 27.4 Realismo y comunicación

- La simulación es orientativa.
- No prometer coincidencia exacta.
- El resultado depende de luz, cámara, iris natural y pantalla.
- No alterar el resto del rostro con IA generativa.
- No cambiar identidad ni maquillaje.
- No enviar la imagen a un modelo generativo por defecto.
- Cargar todo el módulo dinámicamente solo cuando el usuario lo abra.
- Crear fallback si el dispositivo no es compatible.
- Medir errores y rendimiento sin registrar biometría.

---

# 28. ARQUITECTURA TÉCNICA

## 28.1 Principio de portabilidad

La aplicación debe tener una arquitectura de puertos y adaptadores o una separación equivalente:

- Dominio y reglas de negocio independientes.
- Servicios de aplicación.
- interfaces para persistencia.
- adaptadores de base de datos.
- adaptadores de almacenamiento.
- adaptadores de pago.
- adaptadores de analítica.
- adaptadores de notificación.
- capa web.
- configuración de infraestructura.

Cloudflare es un destino de despliegue, no el diseño del dominio.

No usar APIs propietarias dentro de componentes de negocio. Ejemplos:

- No consultar D1 directamente desde un componente visual.
- No subir a R2 directamente desde una página sin pasar por el servicio correspondiente.
- No mezclar payloads de Mercado Pago con la entidad de pedido.
- No disparar Meta directamente desde todas las pantallas sin un módulo unificado.

## 28.2 Stack recomendado

Usa versiones estables actuales y verifica compatibilidad oficial antes de instalar.

Base recomendada, ajustable solo con una razón clara:

- TypeScript estricto.
- Next.js con App Router o la arquitectura oficial estable equivalente.
- React estable.
- CSS moderno con Tailwind CSS o sistema equivalente.
- Componentes accesibles basados en primitivas mantenidas.
- Zod o validación de esquemas equivalente.
- Formularios con una solución mantenida y accesible.
- Drizzle ORM o alternativa que soporte correctamente el destino inicial y mantenga migraciones legibles.
- SQL como fuente de verdad.
- SQLite/D1 como opción inicial de bajo costo, encapsulada.
- Posibilidad de adaptador PostgreSQL futuro.
- Almacenamiento S3-compatible.
- R2 como opción inicial.
- Autenticación mediante una librería mantenida y compatible; no implementar criptografía propia.
- `dnd-kit` o alternativa mantenida para reordenamiento accesible.
- Gráficas ligeras y cargadas solo en administrador.
- Pruebas unitarias con el runner estable del ecosistema.
- Pruebas end-to-end para rutas críticas.
- Linter, formateador y comprobación de tipos.
- Dockerfile de producción para despliegue portable cuando corresponda.
- Adaptador oficial vigente para desplegar Next.js en Cloudflare Workers.

No bloquees el proyecto a nombres concretos si una dependencia quedó obsoleta. Si cambias una recomendación:

- Documenta la razón.
- Usa una opción activa y mantenida.
- Evita paquetes abandonados.
- Evita una dependencia grande para una función trivial.
- Verifica licencia.

## 28.3 Estructura sugerida

```
src/
  app/
    (store)/
    admin/
    api/
  components/
    ui/
    store/
    admin/
  modules/
    catalog/
    cart/
    checkout/
    orders/
    payments/
    shipping/
    promotions/
    coupons/
    inventory/
    customers/
    page-builder/
    analytics/
    auth/
    media/
    try-on/
  domain/
    entities/
    value-objects/
    services/
    errors/
  application/
    use-cases/
    ports/
  infrastructure/
    db/
    storage/
    payments/
    analytics/
    notifications/
    cloudflare/
  lib/
  styles/
  tests/
```

Adapta la estructura a las convenciones reales del framework, pero conserva los límites del dominio.

## 28.4 Ambientes

- Desarrollo local.
- pruebas.
- staging.
- producción.

Cada ambiente debe tener:

- Variables separadas.
- base de datos separada.
- credenciales separadas.
- URLs separadas.
- logs adecuados.
- modo de analítica explícito.
- Mercado Pago de prueba o producción.
- Meta test event en staging.
- almacenamiento separado.

## 28.5 Base de datos

Requisitos:

- Migraciones versionadas.
- seed inicial.
- claves foráneas.
- índices.
- restricciones.
- timestamps.
- borrado lógico donde sea apropiado.
- transacciones.
- idempotencia.
- auditoría.
- exportación.
- estrategia de respaldo.
- no usar JSON como reemplazo indiscriminado de relaciones.
- usar JSON solo para configuraciones flexibles bien validadas.

## 28.6 Esquema conceptual mínimo

Entidades o tablas equivalentes:

- `admin_users`
- `roles`
- `permissions`
- `user_roles`
- `sessions`
- `products`
- `product_variants`
- `product_media`
- `product_attributes`
- `attribute_definitions`
- `categories`
- `product_categories`
- `collections`
- `collection_products`
- `recommendation_rules`
- `inventory_items`
- `inventory_movements`
- `customers`
- `customer_addresses`
- `carts`
- `cart_items`
- `orders`
- `order_items`
- `order_adjustments`
- `order_status_history`
- `payments`
- `payment_events`
- `refunds`
- `shipping_zones`
- `shipping_rules`
- `shipments`
- `coupons`
- `coupon_scopes`
- `coupon_redemptions`
- `promotions`
- `reward_rules`
- `reward_redemptions`
- `popups`
- `pages`
- `page_versions`
- `page_sections`
- `navigation_menus`
- `testimonials`
- `faqs`
- `media_assets`
- `settings`
- `integration_settings`
- `webhook_events`
- `analytics_events`
- `consent_records`
- `audit_logs`
- `idempotency_keys`
- `try_on_textures`
- `temporary_uploads`

No crees tablas innecesarias solo por seguir la lista. Consolida cuando mantenga integridad y claridad. Documenta el modelo final y sus relaciones.

---

# 29. API Y SERVICIOS

Definir contratos claros para:

- Catálogo.
- búsqueda.
- carrito.
- cotización de envío.
- promociones.
- cupones.
- checkout.
- creación de pedido.
- pago.
- webhooks.
- consulta de pedido.
- medios.
- editor visual.
- administración.
- analítica.
- simulador.

Requisitos:

- Validación en límites de entrada.
- Autorización por operación.
- respuestas tipadas.
- errores de dominio.
- idempotencia.
- paginación.
- filtros seguros.
- límites de tamaño.
- protección ante abuso.
- no exponer stack traces.
- no aceptar precios calculados por cliente.
- no confiar en IDs sin revalidar.
- logs correlacionados.
- versión o estrategia de compatibilidad cuando sea necesario.

Usa Server Actions, Route Handlers, RPC tipado o REST según convenga, pero no mezcles estilos sin criterio.

---

# 30. AUTENTICACIÓN, ROLES Y AUDITORÍA

## 30.1 Administradores

- Inicio de sesión seguro.
- contraseña hasheada con algoritmo actual.
- recuperación segura.
- sesiones revocables.
- cookies `HttpOnly`, `Secure` y `SameSite` apropiadas.
- protección CSRF según arquitectura.
- rate limiting.
- bloqueo temporal ante intentos.
- opción de 2FA preparada o implementada si el tiempo lo permite sin debilitar el sistema.
- no revelar si un correo existe en recuperación.
- cierre de todas las sesiones.
- último acceso.

## 30.2 Roles iniciales

- Propietario.
- Administrador.
- Operaciones.
- Editor de contenido.
- Analista de solo lectura.

Permisos por recurso y acción. El propietario puede configurarlos.

## 30.3 Auditoría

Registrar acciones sensibles:

- cambios de precio.
- stock.
- pago manual.
- estado de pedido.
- reembolso.
- reglas de envío.
- cupones.
- promociones.
- publicación de página.
- credenciales o configuración de integración, sin guardar el secreto en texto.
- usuarios.
- roles.
- exportaciones sensibles.

Guardar:

- quién.
- qué.
- entidad.
- antes y después de forma segura.
- fecha.
- IP o contexto cuando sea legal y necesario.
- motivo.
- identificador de correlación.

---

# 31. SEGURIDAD

Implementar, probar y documentar:

- Validación de entrada.
- escape de salida.
- sanitización de rich text.
- CSP.
- HSTS en producción.
- cabeceras de seguridad.
- protección XSS.
- CSRF.
- SSRF.
- inyección SQL.
- subida de archivos.
- MIME real.
- tamaño.
- nombres aleatorios.
- rate limiting.
- protección de login.
- protección de webhooks.
- idempotencia.
- control de acceso.
- menor privilegio.
- rotación de secretos.
- logs sin secretos ni datos de tarjeta.
- dependencia segura.
- auditoría de paquetes.
- backups.
- restauración.
- manejo de errores.
- protección contra manipulación de precio.
- prevención de stock negativo.
- URLs firmadas cuando aplique.
- validación de redirects.
- no usar `dangerouslySetInnerHTML` sin sanitización.
- no exponer variables privadas al cliente.

Crear `.env.example` con nombres y descripción, nunca valores reales.

---

# 32. PRIVACIDAD Y CONSENTIMIENTO

Crear:

- Política de privacidad editable.
- versión de política.
- registro de aceptación de términos en pedidos.
- consentimiento de marketing separado.
- banner o centro de preferencias de cookies cuando sea necesario.
- categorías de almacenamiento:
  - necesario.
  - analítica.
  - marketing.
- Meta desactivado hasta consentimiento cuando la normativa o configuración lo requiera.
- mecanismo para retirar consentimiento.
- minimización de datos.
- retención configurable.
- exportación o eliminación administrativa según la política aplicable.
- tratamiento especial y temporal de fotografías del simulador.

No presentes asesoría legal inventada. Deja la estructura técnica lista y marca los textos legales para revisión humana.

---

# 33. RENDIMIENTO

La tienda se orienta a conexiones móviles y equipos modestos.

Objetivos de campo:

- LCP menor o igual a 2,5 s en condiciones razonables.
- INP menor o igual a 200 ms.
- CLS menor o igual a 0,1.
- HTML útil rápido.
- navegación fluida.
- imágenes correctamente dimensionadas.
- JavaScript público limitado.

Requisitos:

- Server rendering o generación adecuada para catálogo.
- caché con invalidación.
- `next/image` o solución equivalente.
- AVIF/WebP cuando sea viable.
- `srcset`.
- `sizes`.
- lazy loading fuera de viewport.
- prioridad solo al hero real.
- fuentes locales o optimizadas.
- pocas variantes de fuente.
- librerías pesadas solo por demanda.
- separar bundles de tienda y admin.
- no cargar gráficas en público.
- no cargar editor visual en público.
- no cargar simulador hasta abrirlo.
- evitar carruseles pesados.
- evitar videos automáticos.
- poster de video.
- compresión.
- consultas indexadas.
- evitar N+1.
- paginación.
- caché de datos públicos.
- invalidación al publicar.
- CDN para medios.
- skeletons estables.
- analizar bundle.
- presupuesto de rendimiento documentado.

Crear pruebas Lighthouse o equivalentes y registrar resultados reales, no estimados.

---

# 34. ACCESIBILIDAD

Objetivo mínimo: WCAG 2.2 AA en flujos principales.

Requisitos:

- HTML semántico.
- navegación por teclado.
- foco visible.
- orden de foco lógico.
- contraste.
- labels.
- mensajes de error vinculados.
- anuncios de cambios de carrito.
- modales accesibles.
- drawers accesibles.
- no depender solo del color.
- alt text.
- reduced motion.
- tamaños táctiles.
- zoom sin ruptura.
- lector de pantalla.
- tablas con encabezados.
- drag-and-drop con alternativa por botones.
- títulos de página.
- idioma del documento.
- enlaces descriptivos.
- no autoplay con sonido.

---

# 35. SEO Y COMPARTIR

Implementar:

- Metadata por página.
- título.
- descripción.
- canonical.
- Open Graph.
- Twitter cards si aplica.
- sitemap.
- robots.
- URLs limpias.
- breadcrumbs.
- JSON-LD:
  - Organization.
  - WebSite.
  - Product.
  - Offer.
  - BreadcrumbList.
  - FAQ cuando corresponda.
- productos agotados tratados correctamente.
- redirecciones al cambiar slug.
- evitar contenido duplicado por filtros.
- indexación controlada de búsqueda y parámetros.
- páginas rápidas.
- imágenes sociales.
- textos alternativos.
- SEO editable en panel.
- vista previa básica.

No inventar reseñas ni puntuaciones estructuradas.

---

# 36. LOCALIZACIÓN

- Español de Colombia.
- Moneda COP.
- Formato visual `$49.000`.
- Zona horaria configurable, inicial `America/Bogota`.
- Fechas comprensibles.
- Teléfonos colombianos.
- Departamentos y municipios colombianos.
- Normalización de tildes.
- Slugs sin caracteres problemáticos.
- Direcciones flexibles.
- No asumir código postal obligatorio.

Preparar la arquitectura para otros idiomas o monedas sin implementar complejidad innecesaria en V1.

---

# 37. ESTADOS DE UI OBLIGATORIOS

Todo módulo interactivo debe contemplar:

- Inicial.
- carga.
- éxito.
- vacío.
- error recuperable.
- error no recuperable.
- sin permisos.
- sin conexión.
- datos desactualizados.
- acción en progreso.
- confirmación.
- cancelación.
- conflicto de edición.
- sesión expirada.

Especialmente:

- Catálogo vacío.
- búsqueda sin resultados.
- carrito vacío.
- cupón inválido.
- promoción expirada.
- inventario insuficiente.
- tarifa no disponible.
- pago rechazado.
- pago pendiente.
- webhook retrasado.
- transferencia en revisión.
- error al subir imagen.
- publicación con campos incompletos.
- integración sin credenciales.

---

# 38. NOTIFICACIONES

Crear una capa de notificaciones desacoplada.

Posibles canales:

- Pantalla.
- correo SMTP o proveedor configurable.
- copia para WhatsApp.
- webhooks futuros.

Eventos iniciales:

- Pedido creado.
- anticipo recibido.
- pago aprobado.
- pago rechazado.
- pedido confirmado.
- pedido despachado.
- entregado.
- cancelado.
- reembolso.
- stock bajo.
- nueva transferencia pendiente.

Si no hay proveedor de correo configurado:

- No romper el pedido.
- Registrar el intento.
- Mostrar en administrador que el canal no está configurado.
- Permitir reenviar al configurarlo.

---

# 39. OBSERVABILIDAD Y OPERACIÓN

Incluir:

- Logs estructurados.
- niveles.
- request ID.
- order ID.
- payment ID.
- webhook ID.
- filtrado de datos sensibles.
- manejo central de errores.
- métricas básicas.
- estado de integraciones.
- reintentos con límites.
- cola o mecanismo apropiado para trabajos asíncronos si el destino lo soporta.
- dead-letter o registro de fallos.
- panel de webhooks.
- reintento manual seguro.
- health check.
- página de estado interna.
- alertas configurables cuando sea viable.
- presupuesto o límites de uso documentados para Cloudflare.

No implementes complejidad distribuida innecesaria para el volumen inicial, pero evita operaciones frágiles.

---

# 40. PORTABILIDAD Y DESPLIEGUE

## 40.1 Objetivo inicial

Preparar despliegue de bajo costo en Cloudflare usando las soluciones oficiales vigentes:

- Next.js full-stack en Workers mediante adaptador oficial actual.
- D1 como base inicial si la compatibilidad está verificada.
- R2 para medios.
- DNS y dominio en Cloudflare si el propietario lo decide.

## 40.2 Evitar dependencia

- Repositorios de datos detrás de interfaces.
- almacenamiento S3-compatible.
- pagos detrás de interfaz.
- analítica detrás de interfaz.
- configuración mediante variables.
- SQL portable en la medida razonable.
- lógica de negocio sin importaciones de Cloudflare.
- Dockerfile o guía Node.js para otro hosting.
- exportación de datos.
- script de migración.
- documentación de diferencias D1/PostgreSQL.
- no depender de KV para información transaccional.
- usar KV o caché solo para datos regenerables.
- no guardar pedidos únicamente en un servicio efímero.

## 40.3 Entregables de despliegue

- Configuración local.
- staging.
- producción.
- script de build.
- migraciones.
- seed.
- `.env.example`.
- guía Cloudflare.
- guía Docker/Node.
- dominio.
- HTTPS.
- backups.
- restauración.
- rollback de aplicación.
- aclaración de que versiones de código no revierten automáticamente cambios de base de datos.
- checklist de salida.

---

# 41. PRUEBAS Y CONTROL DE CALIDAD

Aunque el usuario haga la validación manual, Claude es responsable de implementar comprobaciones automatizadas razonables.

## 41.1 Unitarias

Prioridad:

- Cálculo de totales.
- promociones.
- cupones.
- recompensa.
- jerarquía de envío.
- pago anticipado.
- saldo contra entrega.
- estados de pago.
- inventario.
- idempotencia.
- permisos.
- formateo monetario.

## 41.2 Integración

- Crear pedido.
- reservar stock.
- aplicar cupón.
- cotizar zona.
- registrar pago.
- webhook duplicado.
- fallo de pago.
- transferencia.
- publicación de página.
- importación de productos.

## 41.3 End-to-end

Flujos críticos:

1. Navegar, agregar, cambiar cantidad y comprar.
2. Pedido Medellín con contra entrega.
3. Pedido fuera de zona con envío pagado por anticipado.
4. Pago total Mercado Pago en entorno de pruebas.
5. Cupón válido e inválido.
6. Recompensa desbloqueada.
7. Administrador crea producto masivo.
8. Administrador cambia tarifa de barrio.
9. Administrador publica una página.
10. Recuperación ante pago pendiente.

No es obligatorio crear decenas de pruebas redundantes. Prioriza riesgo.

## 41.4 Calidad de código

Antes de finalizar una fase:

- Typecheck.
- lint.
- pruebas relevantes.
- build.
- migraciones.
- revisión de secretos.
- rutas rotas.
- accesibilidad básica.
- responsive.
- consola sin errores evitables.

---

# 42. DATOS INICIALES Y SEED

Crear datos de demostración profesionales y claramente identificados como seed:

- Categoría Lentes.
- Categoría Accesorios.
- Subcategorías o familias:
  - Miel/Café.
  - Gris.
  - Verde.
  - Azul.
  - Halloween.
- Productos de ejemplo editables.
- Líquido.
- Pinza y aplicador.
- Colección Más vendidos.
- Página de inicio inicial.
- FAQ inicial.
- Zonas de ejemplo.
- Regla Medellín.
- Regla de envío anticipado fuera del área.
- Cupón de prueba desactivado.
- Promoción de prueba desactivada.
- Usuario administrador creado mediante script seguro, no contraseña fija pública.

No usar seeds como dependencia de producción. El administrador debe poder reemplazarlos.

---

# 43. DOCUMENTACIÓN FINAL

Crear y mantener:

## `README.md`

- Qué es.
- requisitos.
- instalación.
- variables.
- desarrollo.
- build.
- pruebas.
- seed.
- despliegue.
- comandos.

## `docs/ADMIN_GUIDE.md`

- Productos.
- carga masiva.
- categorías.
- inventario.
- pedidos.
- zonas.
- pagos.
- cupones.
- promociones.
- editor visual.
- Meta.
- WhatsApp.
- usuarios.

## `docs/DEPLOYMENT.md`

- Cloudflare.
- Docker/Node.
- base de datos.
- almacenamiento.
- Mercado Pago.
- Meta.
- dominio.
- rollback.
- backups.

## `docs/ARCHITECTURE.md`

- Diagrama textual.
- módulos.
- dependencias.
- puertos.
- adaptadores.
- decisiones.

## `docs/DATA_MODEL.md`

- tablas.
- relaciones.
- estados.
- dinero.
- inventario.
- pagos.

## `docs/PHASE_STATUS.md`

- fase actual.
- completado.
- pendiente.
- decisiones.
- errores conocidos.
- siguiente acción autorizada.

---

# 44. FASES OBLIGATORIAS

# FASE 1 — FUNDAMENTOS, ARQUITECTURA Y UX

## Objetivo

Dejar una base técnica y visual sólida antes de desarrollar todas las funciones.

## Debe incluir

- Auditoría del repositorio.
- Configuración del proyecto.
- TypeScript estricto.
- estructura modular.
- sistema de diseño.
- tokens.
- tipografías.
- layout público.
- layout administrativo.
- navegación.
- rutas principales.
- wireframes o estructura visual funcional.
- componentes base.
- modelo de datos diseñado.
- migraciones iniciales.
- seed.
- contratos de servicios.
- documentos de arquitectura.
- decisiones de portabilidad.
- primera versión navegable con contenido de ejemplo.
- responsive base.
- estados base.
- herramientas de calidad.

## Resultado esperado

El usuario debe poder abrir el proyecto y entender:

- Cómo se verá la marca.
- Cómo se navega.
- Cómo se estructura la tienda.
- Cómo se estructura el panel.
- Qué módulos existirán.
- Qué recorrido seguirá un cliente.
- Qué recorrido seguirá un administrador.

No implementes integraciones reales todavía, excepto los contratos y configuración necesarios.

## Cierre de fase

- Ejecuta comprobaciones.
- Actualiza documentación.
- Entrega exactamente tres validaciones manuales.
- Detente.
- Espera `LUZ VERDE`.

---

# FASE 2 — TIENDA PÚBLICA Y EXPERIENCIA DE COMPRA

## Objetivo

Completar la experiencia visual y funcional del cliente con servicios tipados y datos de desarrollo controlados.

## Debe incluir

- Inicio.
- catálogo.
- búsqueda.
- filtros.
- categorías.
- colecciones.
- tarjeta con cantidad.
- producto.
- favoritos.
- carrito.
- upsells.
- barra de progreso.
- cupones en interfaz.
- checkout completo.
- ubicación.
- visualización de pago parcial.
- WhatsApp.
- páginas de contenido.
- responsive.
- accesibilidad.
- SEO.
- animaciones.
- estados.
- eventos de analítica mediante interfaz.
- editor visual renderizado en la tienda.
- excelente diseño en móvil y escritorio.

Los datos pueden provenir del repositorio local o base de desarrollo, pero toda interacción debe seguir los contratos definitivos. Evita crear una segunda lógica que luego haya que eliminar.

## Resultado esperado

El usuario debe poder recorrer de principio a fin un pedido de demostración y evaluar toda la experiencia visual.

## Cierre de fase

- Ejecuta comprobaciones.
- Actualiza documentación.
- Entrega exactamente tres validaciones manuales.
- Detente.
- Espera `LUZ VERDE`.

---

# FASE 3 — BACKEND, ADMINISTRADOR E INTEGRACIONES

## Objetivo

Convertir la experiencia en un e-commerce real y administrable.

## Debe incluir

- Autenticación.
- roles.
- panel real.
- productos.
- carga masiva.
- CSV.
- categorías.
- colecciones.
- medios.
- inventario.
- clientes.
- pedidos.
- estados.
- zonas.
- reglas de envío.
- pagos parciales.
- transferencia manual.
- Mercado Pago en pruebas.
- webhooks.
- cupones.
- promociones.
- recompensas.
- pop-ups.
- editor no-code.
- publicación.
- Meta Pixel.
- Conversions API.
- UTM.
- WhatsApp configurable.
- auditoría.
- notificaciones.
- configuraciones.
- datos reales de la base.
- importación/exportación.
- pruebas críticas.

Todos los controles administrativos deben estar conectados. No dejar módulos “visualmente listos” sin persistencia.

## Resultado esperado

El administrador debe poder crear un producto, configurar una zona, publicar contenido y recibir un pedido real de prueba con el estado financiero correcto.

## Cierre de fase

- Ejecuta comprobaciones.
- Actualiza documentación.
- Entrega exactamente tres validaciones manuales.
- Detente.
- Espera `LUZ VERDE`.

---

# FASE 4 — SIMULADOR, HARDENING Y SALIDA A PRODUCCIÓN

## Objetivo

Finalizar funciones avanzadas, optimizar, asegurar y preparar despliegue.

## Debe incluir

- Simulador por fotografía.
- privacidad del simulador.
- optimización.
- bundle analysis.
- Core Web Vitals.
- accesibilidad final.
- seguridad.
- rate limiting.
- headers.
- auditoría de dependencias.
- pruebas end-to-end críticas.
- recuperación de errores.
- observabilidad.
- backups.
- exportación.
- documentación final.
- Cloudflare staging.
- configuración de producción.
- alternativa Docker/Node.
- scripts de migración.
- checklist.
- pruebas de Mercado Pago.
- pruebas de Meta.
- prueba completa de pedido.
- revisión de contenido temporal.
- revisión de secretos.
- smoke test.
- preparación del dominio.

## Resultado esperado

Un sistema que pueda salir a producción al colocar credenciales y contenido definitivos, con una guía exacta y sin funciones críticas simuladas.

## Cierre de fase

- Ejecuta comprobaciones finales.
- Actualiza documentación.
- Entrega exactamente tres validaciones manuales finales.
- Detente.
- No declares producción aprobada hasta recibir confirmación del usuario.

---

# 45. FORMATO OBLIGATORIO AL TERMINAR CADA FASE

Usa un mensaje breve con esta estructura:

```md
## Fase X completada

[Resumen de máximo 8 líneas.]

### Validación 1 — [nombre]
1. Abre o ejecuta: [...]
2. Haz: [...]
3. Debes observar: [...]
4. Si falla, envíame: [...]

### Validación 2 — [nombre]
1. Abre o ejecuta: [...]
2. Haz: [...]
3. Debes observar: [...]
4. Si falla, envíame: [...]

### Validación 3 — [nombre]
1. Abre o ejecuta: [...]
2. Haz: [...]
3. Debes observar: [...]
4. Si falla, envíame: [...]

Quedo detenido en la Fase X. No iniciaré la Fase X+1 hasta que escribas: LUZ VERDE
```

No añadas una cuarta validación. No empieces la fase siguiente en el mismo mensaje.

---

# 46. DEFINICIÓN GLOBAL DE TERMINADO

El proyecto solo está terminado cuando:

- La tienda pública funciona.
- El panel funciona.
- Los datos persisten.
- Los cálculos se verifican en servidor.
- El envío jerárquico funciona.
- El pago parcial funciona.
- Mercado Pago funciona en pruebas.
- Los webhooks son idempotentes.
- Los pedidos conservan instantáneas.
- El inventario no se vuelve negativo por errores básicos.
- Los cupones funcionan.
- Las recompensas funcionan.
- Los pop-ups funcionan.
- El editor publica páginas.
- Meta recibe eventos de prueba deduplicados.
- WhatsApp genera el resumen.
- La carga masiva funciona.
- Las categorías son administrables.
- El simulador funciona en dispositivos compatibles y tiene fallback.
- El diseño es responsive.
- La tienda es rápida.
- Los flujos críticos son accesibles.
- No hay secretos en el repositorio.
- La documentación está actualizada.
- El build de producción pasa.
- Existen instrucciones de despliegue.
- Existe estrategia de respaldo y migración.
- No quedan botones falsos.
- No quedan errores conocidos críticos ocultos.
- Todo lo pendiente externo está identificado de forma honesta.

---

# 47. PRIORIDADES EN CASO DE CONFLICTO

Si dos requisitos compiten, usa este orden:

1. Seguridad y exactitud financiera.
2. Integridad de pedidos e inventario.
3. Facilidad de compra.
4. Rendimiento móvil.
5. Accesibilidad.
6. Administrabilidad.
7. Portabilidad.
8. Diseño visual.
9. Animación decorativa.
10. Funciones opcionales.

Nunca sacrifiques un cálculo correcto por una animación.

---

# 48. DECISIONES QUE PUEDES TOMAR SIN PREGUNTAR

Puedes decidir profesionalmente:

- Espaciado.
- tamaño de componentes.
- tipografías libres.
- orden visual exacto.
- estilo de iconos.
- nombres internos.
- estructura de archivos.
- patrón de estado.
- librerías mantenidas.
- diseño de tablas.
- gráficos.
- mensajes de error.
- detalles de animación.
- índices de base de datos.
- estrategia de caché.
- división de componentes.

Siempre que:

- Respetes esta especificación.
- No inventes reglas comerciales.
- Hagas configurables las decisiones cambiantes.
- Documentes decisiones arquitectónicas importantes.
- No generes gastos externos sin aprobación.
- No actives servicios de pago reales sin credenciales y autorización.

---

# 49. DATOS QUE DEBES PEDIR SOLO CUANDO SEAN NECESARIOS

No los solicites todos al inicio. Pídelos en la fase correspondiente:

- Logo final.
- fotos.
- dominio.
- WhatsApp.
- correo.
- redes.
- Mercado Pago public key y access token.
- Meta Pixel ID y token.
- datos bancarios.
- políticas legales.
- tarifas reales.
- horarios.
- usuario propietario.
- credenciales de despliegue.

Mientras no existan, usa configuración de prueba segura.

---

# 50. PRIMERA ACCIÓN OBLIGATORIA

Al recibir este prompt:

1. Inspecciona el repositorio.
2. Crea o actualiza los documentos de contexto.
3. Identifica el stack existente.
4. Comprueba compatibilidad.
5. Inicia exclusivamente la **FASE 1**.
6. Implementa, no te limites a proponer.
7. Al terminar, entrega exactamente tres validaciones.
8. Detente y espera `LUZ VERDE`.

No respondas con otro gran plan teórico si ya puedes empezar a trabajar. No repitas esta especificación. No avances a la Fase 2 sin autorización.

---

## FIN DEL PROMPT MAESTRO
