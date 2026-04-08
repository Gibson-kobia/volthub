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
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,28,32,0.96),rgba(18,20,23,0.98))] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-white/12 hover:shadow-[0_12px_36px_rgba(0,0,0,0.32)] hover:-translate-y-0.5">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(8,10,12,0.95)_65%)] p-3">
          <img
            src={src}
            alt={product.name}
            className="h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,0.0),rgba(10,10,11,0.4))]" />
        </div>
      </Link>
      <div className="relative flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-white/48">{product.brand || "Zora"}</div>
          </div>
          <div
            className={`flex-shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors ${
              inStock
                ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-200"
                : "border-rose-500/40 bg-rose-500/12 text-rose-200"
            }`}
          >
            {inStock ? "In stock" : "Out"}
          </div>
        </div>
        <Link href={`/product/${product.slug}`} className="group/name block">
          <div className="min-h-[2.45rem] overflow-hidden text-sm font-semibold leading-[1.22] text-white transition-colors [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] group-hover/name:text-[color:var(--accent)]">
            {product.name}
          </div>
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/6 pt-2.5">
          <div className="text-lg font-bold leading-none text-white">KES {product.priceKes.toLocaleString()}</div>
          <AddToCartButton
            productId={product.id}
            className="relative rounded-full bg-[color:var(--accent)] px-3 py-1.5 text-[11px] font-semibold text-white transition-transform hover:opacity-90 active:scale-[0.98]"
          />
        </div>
      </div>
    </div>
  );
}
