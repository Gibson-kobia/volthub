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
    <div className="group relative overflow-hidden rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,28,32,0.96),rgba(18,20,23,0.98))] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-white/12 hover:shadow-[0_12px_36px_rgba(0,0,0,0.32)] hover:-translate-y-0.5">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/3.2] overflow-hidden bg-black">
          <img
            src={src}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,0.0),rgba(10,10,11,0.48))]" />
        </div>
      </Link>
      <div className="relative flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/48">{product.brand || "Zora"}</div>
          </div>
          <div
            className={`flex-shrink-0 rounded-full px-2.5 py-1 border text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${
              inStock
                ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-200"
                : "border-rose-500/40 bg-rose-500/12 text-rose-200"
            }`}
          >
            {inStock ? "In stock" : "Out"}
          </div>
        </div>
        <Link href={`/product/${product.slug}`} className="group/name block">
          <div className="text-sm font-semibold leading-tight text-white transition-colors group-hover/name:text-[color:var(--accent)]">
            {product.name}
          </div>
        </Link>
        <div className="text-[11px] uppercase tracking-[0.2em] text-white/45">
          {product.category.replace("-", " ")}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/6 pt-3">
          <div className="text-base font-semibold text-white">KES {product.priceKes.toLocaleString()}</div>
          <AddToCartButton productId={product.id} />
        </div>
      </div>
    </div>
  );
}
