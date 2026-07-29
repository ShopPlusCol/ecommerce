import type { PageDefinition } from "@/modules/page-builder/blocks";

/**
 * Puerto de lectura de páginas del editor visual (sección 15). La tienda
 * renderiza `PageDefinition` sin conocer su origen; en la Fase 2 lo entrega un
 * adaptador de datos de desarrollo y en la Fase 3 un adaptador Drizzle que lee
 * la versión publicada de `pages`/`page_versions`/`page_sections`.
 */
export interface PageRepository {
  getPublishedPage(slug: string): Promise<PageDefinition | null>;
  getHomePage(): Promise<PageDefinition | null>;
}
