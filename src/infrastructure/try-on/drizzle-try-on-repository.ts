import { and, eq, inArray } from "drizzle-orm";
import type { TryOnRepository } from "@/application/ports/try-on-repository";
import type { TryOnTexture } from "@/domain/entities/try-on";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { products, tryOnTextures } from "@/infrastructure/db/schema";

export class DrizzleTryOnRepository implements TryOnRepository {
  async listApprovedByProductIds(productIds: string[]): Promise<TryOnTexture[]> {
    if (!productIds.length) return [];
    const db = await getRuntimeDb();
    const rows = await db
      .select({ texture: tryOnTextures })
      .from(tryOnTextures)
      .innerJoin(products, eq(products.id, tryOnTextures.productId))
      .where(
        and(
          inArray(tryOnTextures.productId, productIds),
          eq(tryOnTextures.reviewStatus, "approved"),
          eq(products.status, "active"),
        ),
      );

    return rows.map(({ texture }) => ({
      id: texture.id,
      productId: texture.productId,
      textureUrl: texture.textureUrl,
      maskUrl: texture.maskUrl,
      baseSize: texture.baseSize,
      opacity: texture.opacity,
      blendMode: texture.blendMode,
      scaleX: texture.scaleX,
      scaleY: texture.scaleY,
      offsetX: texture.offsetX,
      offsetY: texture.offsetY,
      rotationOffset: texture.rotationOffset,
      perspectiveStrength: texture.perspectiveStrength,
      colorCorrection: texture.colorCorrection,
    }));
  }
}
