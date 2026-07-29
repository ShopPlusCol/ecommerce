import type { R2Bucket } from "@cloudflare/workers-types";
import type { StorageProvider } from "@/application/ports/storage-provider";

export class R2StorageProvider implements StorageProvider {
  readonly id = "r2";
  constructor(private readonly bucket: R2Bucket, private readonly publicBaseUrl: string) {}
  async upload({ key, body, contentType }: { key: string; body: Uint8Array; contentType: string }) {
    await this.bucket.put(key, body, { httpMetadata: { contentType } });
    return { key, url: this.getPublicUrl(key), contentType, size: body.byteLength };
  }
  async delete(key: string) {
    await this.bucket.delete(key);
  }
  async getSignedUploadUrl(): Promise<string> {
    throw new Error("R2 usa carga autenticada a través del backend; no se expone firma S3.");
  }
  getPublicUrl(key: string) {
    return `${this.publicBaseUrl.replace(/\/$/, "")}/${encodeURI(key)}`;
  }
}
