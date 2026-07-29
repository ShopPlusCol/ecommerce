import { cache } from "react";
import { eq } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { settings } from "@/infrastructure/db/schema";
import { siteConfig } from "@/lib/site-config";

export type BrandSettings = {
  name: string;
  tagline: string;
  description: string;
  mode: "text" | "image" | "image_text";
  logoUrl: string | null;
  mobileLogoUrl: string | null;
  footerLogoUrl: string | null;
  faviconUrl: string | null;
  appleTouchIconUrl: string | null;
  openGraphImageUrl: string | null;
  altText: string;
  email: string;
  whatsapp: string;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
};

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  name: siteConfig.brandName,
  tagline: siteConfig.tagline,
  description: siteConfig.description,
  mode: "text",
  logoUrl: null,
  mobileLogoUrl: null,
  footerLogoUrl: null,
  faviconUrl: null,
  appleTouchIconUrl: null,
  openGraphImageUrl: null,
  altText: "ShopPlusCol",
  email: siteConfig.contact.supportEmail,
  whatsapp: siteConfig.contact.whatsappNumber,
  instagram: siteConfig.social.instagram,
  facebook: siteConfig.social.facebook,
  tiktok: siteConfig.social.tiktok,
};

export const getBrandSettings = cache(async (): Promise<BrandSettings> => {
  try {
    const db = await getRuntimeDb();
    const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, "brand")).limit(1);
    return row?.value && typeof row.value === "object"
      ? { ...DEFAULT_BRAND_SETTINGS, ...(row.value as Partial<BrandSettings>) }
      : DEFAULT_BRAND_SETTINGS;
  } catch {
    return DEFAULT_BRAND_SETTINGS;
  }
});
