import type { Product } from "@/domain/entities/catalog";
import type { TryOnTexture } from "@/domain/entities/try-on";

export function fallbackTexture(product: Product): TryOnTexture {
  return {
    id: `fallback-${product.id}`,
    productId: product.id,
    textureUrl: "/try-on/iris-base.svg",
    maskUrl: null,
    baseSize: 100,
    opacity: 82,
    blendMode: "multiply",
    scaleX: 112,
    scaleY: 106,
    rotationOffset: 0,
    perspectiveStrength: 0,
    colorCorrection: {
      tint: product.colorFamily?.hexSwatch ?? "#777777",
      saturation: 112,
      brightness: 102,
    },
  };
}
