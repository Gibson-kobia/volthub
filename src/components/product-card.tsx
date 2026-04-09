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
  const brand = product.brand?.trim() || "Zora";
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(23,26,30,0.98),rgba(15,17,20,0.98))] shadow-[0_14px_32px_rgba(0,0,0,0.26)] transition-all duration-300 hover:border-white/14 hover:shadow-[0_16px_36px_rgba(0,0,0,0.34)] hover:-translate-y-0.5">
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.32),transparent)]" />
      <Link href={`/product/${product.slug}`} className="block px-2.5 pt-2.5">
        <div className="relative aspect-square overflow-hidden rounded-[16px] border border-white/7 bg-[linear-gradient(180deg,rgba(34,39,44,0.96),rgba(16,18,22,1))] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="absolute inset-[9px] rounded-[12px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),rgba(255,255,255,0)_58%)]" />
          <div className="absolute inset-x-2.5 top-2.5 z-10 flex items-start justify-between gap-2">
            <div className="min-w-0 rounded-full bg-black/22 px-2 py-0.5 backdrop-blur-md">
              <div className="truncate text-[8px] font-medium uppercase tracking-[0.18em] text-white/34">{brand}</div>
            </div>
            <div
              className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] font-medium tracking-[0.12em] backdrop-blur-md ${
                inStock
                  ? "border-emerald-400/25 bg-emerald-400/8 text-emerald-100/88"
                  : "border-rose-400/25 bg-rose-400/8 text-rose-100/88"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-emerald-300" : "bg-rose-300"}`} />
              {inStock ? "Ready" : "Out"}
            </div>
          </div>
          <img
            src={src}
            alt={product.name}
            className="h-full w-full object-contain object-center p-4 transition-transform duration-500 group-hover:scale-[1.035]"
          />
          <div className="absolute inset-x-0 bottom-0 h-14 bg-[linear-gradient(180deg,rgba(10,10,11,0),rgba(10,10,11,0.18))]" />
        </div>
      </Link>
      <div className="relative flex flex-1 flex-col px-3 pb-3 pt-2">
        <Link href={`/product/${product.slug}`} className="group/name block">
          <div className="min-h-[2.2rem] overflow-hidden text-[13px] font-medium leading-[1.14] tracking-[-0.015em] text-white/96 transition-colors [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] group-hover/name:text-[color:var(--accent)]">
            {product.name}
          </div>
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <div className="text-[8px] font-medium uppercase tracking-[0.2em] text-white/34">KES</div>
            <div className="mt-0.5 text-[18px] font-semibold leading-none tracking-[-0.04em] text-white tabular-nums">
              {product.priceKes.toLocaleString()}
            </div>
          </div>
          <AddToCartButton
            productId={product.id}
            compact
            label="Add"
            addedLabel="Added"
            ariaLabel={`Add ${product.name} to cart`}
            className="relative rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(63,113,255,0.24),rgba(47,107,255,0.14))] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-all hover:border-white/18 hover:bg-[linear-gradient(180deg,rgba(63,113,255,0.28),rgba(47,107,255,0.18))] active:scale-[0.98]"
          />
        </div>
      </div>
    </div>
  );
}
