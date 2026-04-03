"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProductsByCategory, type Product } from "../../../lib/products";
import { ProductCard } from "../../../components/product-card";
import type { CategorySlug } from "../../../lib/types";

const CATEGORY_LABELS: Record<CategorySlug, string> = {
  audio: "Audio",
  smartwatches: "Smartwatches",
  "chargers-cables": "Chargers & Cables",
  "power-banks": "Power Banks",
  "phone-accessories": "Phone Accessories",
  speakers: "Speakers",
  groceries: "Groceries",
  beverages: "Beverages",
  household: "Household",
  snacks: "Snacks",
  "personal-care": "Personal Care",
  electronics: "Electronics",
};

function isCategorySlug(v: string): v is CategorySlug {
  return Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, v);
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const rawSlug = params.slug;
  const slug = isCategorySlug(rawSlug) ? rawSlug : null;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const category = slug;
    async function load() {
      setLoading(true);
      const data = await fetchProductsByCategory(category);
      setProducts(data);
      setLoading(false);
    }
    load();
  }, [slug]);

  const title = useMemo(() => (slug ? CATEGORY_LABELS[slug] : ""), [slug]);

  if (!slug) return notFound();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs text-zinc-500">Category</div>
          <h1 className="font-serif text-3xl">{title}</h1>
        </div>
        <Link href="/shop" className="rounded-full px-4 py-2 border text-sm">
          Back to shop
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-black/10 dark:border-white/10 p-10 bg-white dark:bg-black text-center">
          <div className="font-serif text-2xl">Products coming soon</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            No products available in {title.toLowerCase()} yet. Check back soon.
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/shop" className="inline-block rounded-full px-5 py-2 border text-sm">
              Back to shop
            </Link>
            <Link href="/offers" className="inline-block rounded-full px-5 py-2 border text-sm">
              View deals
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
