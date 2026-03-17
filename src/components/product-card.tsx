"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Product } from "../lib/types";
import { AddToCartButton } from "./add-to-cart-button";

export function ProductCard({ product }: { product: Product }) {
  const [error, setError] = useState(false);
  const blur = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><rect width='100%' height='100%' fill='%23f5e7c6'/></svg>";
  const src =
    !error && product.image && product.image.startsWith("http")
      ? product.image
      : "/product-placeholder.png";
  const inStock = product.stock > 0;
  return (
    <div className="group rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black overflow-hidden">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5]">
          <Image
            src={src}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            placeholder="blur"
            blurDataURL={blur}
            onError={() => setError(true)}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="text-xs text-zinc-500 truncate">{product.brand}</div>
          <div
            className={`text-[11px] rounded-full px-2 py-0.5 border ${
              inStock
                ? "border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900"
                : "border-red-200 text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900"
            }`}
          >
            {inStock ? "In stock" : "Out"}
          </div>
        </div>
        <Link href={`/product/${product.slug}`} className="block">
          <div className="font-medium">{product.name}</div>
        </Link>
        <div className="mt-2 font-semibold">KES {product.priceKes.toLocaleString()}</div>
        <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 capitalize">
          {product.category.replace("-", " ")}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <AddToCartButton productId={product.id} />
        </div>
      </div>
    </div>
  );
}
