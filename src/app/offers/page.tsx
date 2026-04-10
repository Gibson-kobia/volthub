"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchProducts, type Product } from "../../lib/products";
import { ProductCard } from "../../components/product-card";

export default function OffersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchProducts();
      setProducts(data);
      setLoading(false);
    }
    load();
  }, []);

  const deals = useMemo(() => {
    const under = products.filter((p) => p.priceKes <= 3000).slice(0, 8);
    if (under.length >= 4) return under;
    return [...under, ...products.slice(0, 8 - under.length)];
  }, [products]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white/60">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20">
      <div className="rounded-[28px] border border-[color:var(--warning)]/24 bg-[linear-gradient(135deg,rgba(255,184,77,0.09),rgba(24,28,32,0.96))] px-5 py-6 sm:px-7 sm:py-7">
        <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--warning)]">
          Value picks
        </div>
        <h1 className="mt-2 font-serif text-3xl text-white sm:text-4xl">
          Today&apos;s deals
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/64">
          Curated picks across groceries, household items, snacks, and electronics. No fake markdowns — products priced to move.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/shop" className="inline-flex min-h-9 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/10">
            All products
          </Link>
          <Link href="/category/groceries" className="inline-flex min-h-9 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/10">
            Groceries
          </Link>
          <Link href="/category/household" className="inline-flex min-h-9 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/10">
            Household
          </Link>
          <Link href="/category/electronics" className="inline-flex min-h-9 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/10">
            Electronics
          </Link>
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="mt-10 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,28,32,0.88),rgba(18,20,23,0.96))] p-10 text-center">
          <div className="font-serif text-2xl text-white">No deals yet</div>
          <div className="mt-2 text-sm text-white/56">
            Check back soon as the catalog grows.
          </div>
          <Link
            href="/shop"
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white"
          >
            Browse full shop
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {deals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

