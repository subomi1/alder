import { Link } from "@tanstack/react-router";
import { formatRating, money } from "@/lib/format";
import type { ProductCard as Product } from "@/lib/catalog/types";
import { ProductImage } from "./product-image";
import { Stars } from "./stars";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group block overflow-hidden rounded-lg bg-surface shadow-card transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="aspect-square overflow-hidden bg-paper-deep">
        <ProductImage
          src={product.imageUrl}
          name={product.name}
          className="transition-transform duration-200 group-hover:scale-105"
        />
      </div>
      <div className="space-y-2 p-4">
        <p className="text-xs tracking-widest text-muted uppercase">{product.brand}</p>
        <h3 className="font-serif text-xl text-ink">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-muted">{product.summary}</p>
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="flex items-center gap-2 text-sm text-ink-soft">
            <Stars value={product.avgRating} />
            <span className="tabular-nums">{formatRating(product.avgRating)}</span>
          </span>
          <span className="text-sm font-medium tabular-nums">{money(product.priceCents)}</span>
        </div>
      </div>
    </Link>
  );
}
