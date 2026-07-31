const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "ogv"]);

/** Detecta si una URL de medio apunta a un video, por su extensión (sección 8.5). */
export function isVideoUrl(url: string): boolean {
  const clean = url.split(/[?#]/, 1)[0];
  const dot = clean.lastIndexOf(".");
  if (dot === -1) return false;
  return VIDEO_EXTENSIONS.has(clean.slice(dot + 1).toLowerCase());
}
