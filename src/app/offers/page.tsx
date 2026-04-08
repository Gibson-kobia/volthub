"use client";

import { useEffect, useMemo, useState } from "react";
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
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-serif text-3xl">Deals</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Great value picks across chargers, audio, and everyday accessories.
      </p>

      {deals.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-black/10 dark:border-white/10 p-10 bg-white dark:bg-black text-center">
          <div className="font-serif text-2xl">No deals yet</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Add products in admin or connect your Supabase database.
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {deals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
