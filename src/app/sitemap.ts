import type { MetadataRoute } from "next";
import { catalogRepository } from "@/lib/container";
import { siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, categories, colorFamilies, collections] = await Promise.all([
    catalogRepository.getAllProductSlugs(),
    catalogRepository.listCategories(),
    catalogRepository.listColorFamilies(),
    catalogRepository.listCollections(),
  ]);

  const staticPaths = [
    "/",
    "/catalogo",
    "/cuidados",
    "/envios",
    "/devoluciones",
    "/preguntas-frecuentes",
    "/privacidad",
    "/terminos",
    "/contacto",
  ];

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticPaths) {
    entries.push({ url: siteUrl(path), lastModified: now });
  }
  for (const slug of slugs) {
    entries.push({ url: siteUrl(`/productos/${slug}`), lastModified: now });
  }
  for (const category of categories) {
    entries.push({ url: siteUrl(`/categoria/${category.slug}`), lastModified: now });
  }
  for (const family of colorFamilies) {
    entries.push({ url: siteUrl(`/categoria/${family.slug}`), lastModified: now });
  }
  for (const collection of collections) {
    entries.push({ url: siteUrl(`/coleccion/${collection.slug}`), lastModified: now });
  }

  return entries;
}
