/**
 * Lista completa de los 32 departamentos de Colombia más Bogotá D.C., para
 * el selector de Departamento del checkout. A diferencia de Ciudad/Municipio
 * y Barrio (que solo muestran lo que el admin configuró en `/admin/envios`,
 * sección 17.3), el Departamento siempre muestra la lista real completa:
 * un cliente fuera de las zonas configuradas debe poder seleccionar su
 * departamento real y recibir la cotización de respaldo nacional en vez de
 * quedar sin poder avanzar.
 */
export const COLOMBIA_DEPARTMENTS: string[] = [
  "Amazonas",
  "Antioquia",
  "Arauca",
  "Atlántico",
  "Bogotá D.C.",
  "Bolívar",
  "Boyacá",
  "Caldas",
  "Caquetá",
  "Casanare",
  "Cauca",
  "Cesar",
  "Chocó",
  "Córdoba",
  "Cundinamarca",
  "Guainía",
  "Guaviare",
  "Huila",
  "La Guajira",
  "Magdalena",
  "Meta",
  "Nariño",
  "Norte de Santander",
  "Putumayo",
  "Quindío",
  "Risaralda",
  "San Andrés y Providencia",
  "Santander",
  "Sucre",
  "Tolima",
  "Valle del Cauca",
  "Vaupés",
  "Vichada",
];
