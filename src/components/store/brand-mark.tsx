import Image from "next/image";
import type { BrandSettings } from "@/modules/settings/brand";

export function BrandMark({ brand, placement = "header" }: { brand: BrandSettings; placement?: "header" | "mobile" | "footer" }) {
  const image = placement === "mobile"
    ? brand.mobileLogoUrl ?? brand.logoUrl
    : placement === "footer" ? brand.footerLogoUrl ?? brand.logoUrl : brand.logoUrl;
  const showImage = brand.mode !== "text" && image;
  const showText = brand.mode !== "image" || !image;
  return (
    <span className="inline-flex items-center gap-2">
      {showImage ? <Image src={image} alt={brand.altText || brand.name} width={160} height={48} className="h-9 w-auto object-contain" unoptimized /> : null}
      {showText ? <span>{brand.name}</span> : <span className="sr-only">{brand.name}</span>}
    </span>
  );
}
