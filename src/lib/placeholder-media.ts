/**
 * Reconoce las imágenes de ejemplo que trae el proyecto. Se usa para poder
 * mostrarlas etiquetadas como tales: una foto de ejemplo presentada como si
 * fuera el producto real hace que la clienta compre un tono que no ha visto.
 *
 * Es deliberadamente conservador (solo la carpeta de demo y el sufijo
 * "placeholder"): marcar de más una foto real sería peor que no marcarla.
 */
export function isPlaceholderMedia(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith("/demo/") || /placeholder\.(svg|png|jpe?g|webp)$/i.test(url);
}
