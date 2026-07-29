/**
 * Datos de ubicación para el checkout (departamentos, municipios y barrios de
 * ejemplo). En la Fase 3 estos vienen de la base de datos y son administrables
 * (sección 17.5). Aquí son un subconjunto suficiente para probar el flujo:
 * Medellín y Área Metropolitana con detalle, más departamentos principales.
 */
export type DepartmentOption = {
  name: string;
  cities: string[];
};

export const MEDELLIN_NEIGHBORHOODS = [
  "El Poblado",
  "Laureles",
  "Belén",
  "La América",
  "Robledo",
  "Buenos Aires",
  "Manrique",
  "Castilla",
  "Otro / no aparece",
];

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

export function isMedellin(city: string): boolean {
  return city.trim().toLowerCase() === "medellín" || city.trim().toLowerCase() === "medellin";
}
