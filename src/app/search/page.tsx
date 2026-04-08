"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchProducts, type Product } from "../../lib/products";
import { ProductCard } from "../../components/product-card";

export default function SearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = searchParams?.q?.toString() || "";
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

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return products;
    return products.filter((p) => {
      const hay = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
      return hay.includes(query);
    });
  }, [q, products]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="font-serif text-3xl">Search</h1>
      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {q ? `Results for “${q}” (${results.length})` : `Browse all products (${products.length})`}
      </div>

      {results.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-black/10 dark:border-white/10 p-10 bg-white dark:bg-black text-center">
          <div className="font-serif text-2xl">No matches found</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Try searching by brand, category, or a product name.
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
