"use client";
import Link from "next/link";
import { Product } from "../lib/types";
import { AddToCartButton } from "./add-to-cart-button";

export function ProductCard({ product }: { product: Product }) {
  const src =
    product.image && product.image.startsWith("http")
      ? product.image
      : "/product-placeholder.png";
  const inStock = product.stock > 0;
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-light-border bg-white transition-all duration-300 hover:border-primary/20 hover:shadow-sm">
      <Link href={`/product/${product.slug}`} className="block px-3 pt-3">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-light-border bg-off-white">
          <img
            src={src}
            alt={product.name}
            className="h-full w-full object-contain object-center p-4 transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>
      <div className="relative flex flex-1 flex-col px-3 pb-3 pt-2">
        <Link href={`/product/${product.slug}`} className="group/name block">
          <div className="min-h-[2.2rem] overflow-hidden text-sm font-medium leading-tight tracking-tight text-deep-ink transition-colors [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] group-hover/name:text-primary">
            {product.name}
          </div>
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-muted">KES</div>
            <div className="mt-0.5 text-lg font-semibold leading-none tracking-tight text-deep-ink tabular-nums">
              {product.priceKes.toLocaleString()}
            </div>
          </div>
          {inStock ? (
            <AddToCartButton
              productId={product.id}
              compact
              label="Add"
              addedLabel="Added"
              ariaLabel={`Add ${product.name} to cart`}
              className="relative rounded-lg border border-primary bg-primary px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-primary/90 active:scale-95"
            />
          ) : (
            <span className="rounded-lg border border-light-border px-3 py-2 text-xs font-medium text-muted bg-off-white">
              Sold out
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
