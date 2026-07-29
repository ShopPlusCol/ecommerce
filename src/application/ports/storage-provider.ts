/**
 * Puerto de almacenamiento de medios, compatible con S3 (R2 en Cloudflare,
 * disco local en desarrollo, cualquier proveedor S3-compatible al migrar).
 */
export type UploadResult = {
  key: string;
  url: string;
  contentType: string;
  size: number;
};

export interface StorageProvider {
  readonly id: string;
  upload(params: { key: string; body: Uint8Array; contentType: string }): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getSignedUploadUrl(params: { key: string; contentType: string; expiresInSeconds: number }): Promise<string>;
  getPublicUrl(key: string): string;
}
