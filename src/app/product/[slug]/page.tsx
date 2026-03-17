"use client";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProductBySlug, fetchProducts, type Product } from "../../../lib/products";
import { AddToCartButton } from "../../../components/add-to-cart-button";
import { AddToWishlistButton } from "../../../components/add-to-wishlist-button";
import { useState, useEffect } from "react";
import { ReviewButton } from "../../../components/review-button";
import type { CategorySlug } from "../../../lib/types";

const CATEGORY_LABELS: Record<CategorySlug, string> = {
  audio: "Audio",
  smartwatches: "Smartwatches",
  "chargers-cables": "Chargers & Cables",
  "power-banks": "Power Banks",
  "phone-accessories": "Phone Accessories",
  speakers: "Speakers",
};

function getHighlights(category: CategorySlug) {
  const common = ["Fast delivery in Kenya", "Support on WhatsApp"];
  const byCategory: Record<CategorySlug, string[]> = {
    audio: ["Clear sound for calls and music", "Comfortable for daily use", ...common],
    smartwatches: ["Fitness tracking and notifications", "All‑day battery focus", ...common],
    "chargers-cables": ["Reliable fast charging", "Travel‑friendly size", ...common],
    "power-banks": ["Charge on the go", "High‑capacity everyday backup", ...common],
    "phone-accessories": ["Protection and everyday convenience", "Easy to carry and use", ...common],
    speakers: ["Portable sound for home and outdoors", "Easy pairing and controls", ...common],
  };
  return byCategory[category];
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const [imgError, setImgError] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const p = await fetchProductBySlug(params.slug);
        setProduct(p);

        if (p) {
          const allProducts = await fetchProducts();
          const rel = allProducts
            .filter((item) => item.category === p.category && item.id !== p.id)
            .slice(0, 4);
          setRelated(rel);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!product) return notFound();
  const blur = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><rect width='100%' height='100%' fill='%23f5e7c6'/></svg>";
  const inStock = product.stock > 0;
  const categoryLabel = CATEGORY_LABELS[product.category as CategorySlug] ?? "Gadgets";
  const highlights = getHighlights(product.category as CategorySlug);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/shop" className="text-sm underline hover:opacity-80">
          Back to shop
        </Link>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">{categoryLabel}</div>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden border bg-white dark:bg-black">
          {product.image.startsWith("http") && !imgError && (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={blur}
              onError={() => setImgError(true)}
              className="object-cover"
            />
          )}
        </div>
        <div>
          <div className="text-sm text-zinc-500">{product.brand}</div>
          <div className="font-serif text-2xl mt-1">{product.name}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`text-xs rounded-full px-3 py-1 border ${
                inStock
                  ? "border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900"
                  : "border-red-200 text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900"
              }`}
            >
              {inStock ? `${product.stock} in stock` : "Out of stock"}
            </span>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              {product.rating > 0 ? `${product.rating.toFixed(1)} rating` : "Ratings coming soon"}
            </span>
          </div>
          <div className="mt-3 text-xl font-semibold">KES {product.priceKes.toLocaleString()}</div>
          <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">{product.description}</p>
          <div className="mt-5 flex gap-3">
            <AddToCartButton productId={product.id} />
            <AddToWishlistButton productId={product.id} />
          </div>
          <div className="mt-4">
            <ReviewButton productId={product.id} />
          </div>
          <div className="mt-6 rounded-xl border border-black/10 dark:border-white/10 p-5 bg-white/60 dark:bg-black/40">
            <div className="font-medium mb-3">Key features</div>
            <ul className="text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5 space-y-1">
              {highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
          <div className="mt-6 rounded-xl border border-black/10 dark:border-white/10 p-5 bg-white/60 dark:bg-black/40">
            <div className="font-medium mb-3">Specifications</div>
            <div className="text-sm grid grid-cols-2 gap-3">
              <div className="text-zinc-600 dark:text-zinc-400">Brand</div>
              <div>{product.brand}</div>
              <div className="text-zinc-600 dark:text-zinc-400">Category</div>
              <div>{categoryLabel}</div>
              <div className="text-zinc-600 dark:text-zinc-400">Stock</div>
              <div>{inStock ? `${product.stock} available` : "Currently unavailable"}</div>
            </div>
            <div className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
              Delivery: Nairobi same‑day options, nationwide courier in 1‑3 working days. Payment: M‑Pesa instructions after order confirmation.
            </div>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <div className="mt-12">
          <div className="font-serif text-xl mb-4">You may also like</div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => (
              <div key={p.id} className="rounded-xl border p-4 bg-white dark:bg-black">
                <Link href={`/product/${p.slug}`} className="block">
                  <div className="relative aspect-[4/5] rounded-md overflow-hidden">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      placeholder="blur"
                      blurDataURL={blur}
                      className="object-cover"
                    />
                  </div>
                  <div className="mt-3 text-xs text-zinc-500">{p.brand}</div>
                  <div className="font-medium">{p.name}</div>
                  <div className="mt-1 font-semibold">KES {p.priceKes.toLocaleString()}</div>
                  <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <span aria-hidden>☆☆☆☆☆</span>
                    <span className="ml-2">No reviews yet</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
