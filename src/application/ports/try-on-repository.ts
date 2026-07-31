import type { TryOnTexture } from "@/domain/entities/try-on";

export interface TryOnRepository {
  listApprovedByProductIds(productIds: string[]): Promise<TryOnTexture[]>;
}
