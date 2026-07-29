import type { StorageProvider } from "@/application/ports/storage-provider";
import { getCloudflareEnv } from "@/infrastructure/cloudflare/env";
import { LocalStorageProvider } from "./local-storage-provider";
import { R2StorageProvider } from "./r2-storage-provider";

export async function getStorageProvider(): Promise<StorageProvider> {
  const cloudflare = await getCloudflareEnv();
  if (cloudflare) {
    const publicUrl = process.env.MEDIA_PUBLIC_URL;
    if (!publicUrl) throw new Error("MEDIA_PUBLIC_URL es obligatorio al usar R2.");
    return new R2StorageProvider(cloudflare.MEDIA_BUCKET, publicUrl);
  }
  return new LocalStorageProvider();
}
