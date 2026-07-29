import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import type { StorageProvider } from "@/application/ports/storage-provider";

export class LocalStorageProvider implements StorageProvider {
  readonly id = "local";
  private readonly root = join(process.cwd(), "public", "uploads");

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
    return `/uploads/${key.replaceAll("\\", "/")}`;
  }
}
