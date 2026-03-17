"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchProducts, type Product } from "../../lib/products";
import { ProductCard } from "../../components/product-card";
import type { CategorySlug } from "../../lib/types";

const CATEGORIES: { slug: CategorySlug; label: string }[] = [
  { slug: "audio", label: "Audio" },
  { slug: "smartwatches", label: "Smartwatches" },
  { slug: "chargers-cables", label: "Chargers & Cables" },
  { slug: "power-banks", label: "Power Banks" },
  { slug: "phone-accessories", label: "Phone Accessories" },
  { slug: "speakers", label: "Speakers" },
];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategorySlug | "all">("all");

  useEffect(() => {
    async function load() {
      const data = await fetchProducts();
      setProducts(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === "all") return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl">Shop</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Gadgets and accessories with fast delivery in Kenya.
          </p>
        </div>
        <Link
          href="/cart"
          className="rounded-full px-4 py-2 border border-black/10 dark:border-white/10 text-sm w-fit"
        >
          View cart
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-full text-sm border ${
            activeCategory === "all" ? "bg-[color:var(--accent)] text-white border-transparent" : ""
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setActiveCategory(c.slug)}
            className={`px-4 py-2 rounded-full text-sm border ${
              activeCategory === c.slug ? "bg-[color:var(--accent)] text-white border-transparent" : ""
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-400">
        {CATEGORIES.map((c) => (
          <Link key={c.slug} href={`/category/${c.slug}`} className="underline hover:opacity-80">
            Browse {c.label.toLowerCase()}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-black/10 dark:border-white/10 p-10 bg-white dark:bg-black text-center">
          <div className="font-serif text-2xl">Products coming soon</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            No products available yet. Check back soon.
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/" className="inline-block rounded-full px-5 py-2 border text-sm">
              Back to home
            </Link>
            <Link href="/offers" className="inline-block rounded-full px-5 py-2 border text-sm">
              View deals
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
