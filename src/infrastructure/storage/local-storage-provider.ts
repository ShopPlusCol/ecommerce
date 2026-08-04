import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import type { StorageProvider } from "@/application/ports/storage-provider";

/**
 * Carpeta pública donde se guardan los archivos subidos.
 *
 * Configurable para que el entorno de pruebas escriba en su propia carpeta
 * (`uploads-staging`) y no mezcle los archivos de una validación con los
 * medios reales de la tienda. Por defecto se comporta exactamente como
 * antes.
 */
const MEDIA_DIRECTORY = process.env.MEDIA_DIRECTORY?.trim() || "uploads";

export class LocalStorageProvider implements StorageProvider {
  readonly id = "local";
  private readonly root = join(process.cwd(), "public", MEDIA_DIRECTORY);

  private pathFor(key: string) {
    const safe = normalize(key).replace(/^(\.\.(\\|\/|$))+/, "");
    const target = join(this.root, safe);
    if (!target.startsWith(this.root)) throw new Error("Ruta de almacenamiento inválida.");
    return target;
  }
  async upload({ key, body, contentType }: { key: string; body: Uint8Array; contentType: string }) {
    const target = this.pathFor(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, body);
    return { key, url: this.getPublicUrl(key), contentType, size: body.byteLength };
  }
  async delete(key: string) {
    await rm(this.pathFor(key), { force: true });
  }
  async getSignedUploadUrl(): Promise<string> {
    throw new Error("La carga local se realiza a través del servidor.");
  }
  getPublicUrl(key: string) {
    return `/${MEDIA_DIRECTORY}/${key.replaceAll("\\", "/")}`;
  }
}
