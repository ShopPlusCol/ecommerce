export type TryOnBlendMode = "multiply" | "overlay" | "soft-light" | "source-over";

export type TryOnTexture = {
  id: string;
  productId: string;
  textureUrl: string;
  maskUrl: string | null;
  baseSize: number;
  opacity: number;
  blendMode: TryOnBlendMode;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  rotationOffset: number;
  perspectiveStrength: number;
  colorCorrection: {
    tint?: string;
    saturation?: number;
    brightness?: number;
  };
};
