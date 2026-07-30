/**
 * Departamentos y municipios de ejemplo para el checkout (subconjunto
 * suficiente para probar el flujo). Los barrios ya no viven aquí: se
 * administran por completo en `/admin/envios` (grupos de barrios por
 * ciudad, sección 17.5) y llegan al checkout vía `listConfiguredNeighborhoodsAction`.
 */
export type DepartmentOption = {
  name: string;
  cities: string[];
};

export const DEPARTMENTS: DepartmentOption[] = [
  {
    name: "Antioquia",
    cities: ["Medellín", "Bello", "Envigado", "Itagüí", "Sabaneta", "La Estrella", "Rionegro", "Otro municipio"],
  },
  { name: "Cundinamarca", cities: ["Bogotá", "Soacha", "Chía", "Otro municipio"] },
  { name: "Valle del Cauca", cities: ["Cali", "Palmira", "Otro municipio"] },
  { name: "Atlántico", cities: ["Barranquilla", "Soledad", "Otro municipio"] },
  { name: "Santander", cities: ["Bucaramanga", "Floridablanca", "Otro municipio"] },
  { name: "Otro departamento", cities: ["Otra ciudad"] },
];

export function citiesForDepartment(department: string): string[] {
  return DEPARTMENTS.find((d) => d.name === department)?.cities ?? [];
}
