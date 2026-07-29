import type { Money } from "@/domain/value-objects/money";

export type ProductStatus = "draft" | "active" | "archived";

export type ColorFamily = {
  id: string;
  slug: string;
  name: string;
  hexSwatch: string | null;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  imageUrl: string | null;
  order: number;
  visibleInMenu: boolean;
  visibleInFilters: boolean;
  archivedAt: string | null;
};

export type ProductBadge = "nuevo" | "mas-vendido" | "promocion" | "halloween" | "agotado";

export type ProductMedia = {
  id: string;
  url: string;
  altText: string;
  order: number;
  isVideoPoster: boolean;
};

export type Product = {
  id: string;
  slug: string;
  sku: string;
  status: ProductStatus;
  name: string;
  shortDescription: string;
  description: string;
  price: Money;
  compareAtPrice: Money | null;
  colorFamily: ColorFamily | null;
  categoryIds: string[];
  media: ProductMedia[];
  badges: ProductBadge[];
  stock: number;
  allowBackorder: boolean;
  featured: boolean;
  publishedAt: string | null;
};
