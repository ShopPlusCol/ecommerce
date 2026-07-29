import type { Product } from "@/domain/entities/catalog";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/store/product-card";

export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
