"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "../components/product-card";
import { fetchProducts, Product } from "../lib/products";
import type { CategorySlug } from "../lib/types";

const TRUST_ITEMS = [
  "Fast WhatsApp support",
  "M-Pesa accepted",
  "Nairobi same-day delivery",
];

const HOMEPAGE_CATEGORIES: {
  slug: CategorySlug;
  title: string;
  description: string;
}[] = [
  {
    slug: "groceries",
    title: "Groceries",
    description: "Pantry staples and home restocks.",
  },
  {
    slug: "beverages",
    title: "Beverages",
    description: "Drinks for daily stocking and quick top-ups.",
  },
  {
    slug: "snacks",
    title: "Snacks",
    description: "Easy treats, bites, and grab-and-go picks.",
  },
  {
    slug: "household",
    title: "Household",
    description: "Cleaning, utility, and everyday home basics.",
  },
  {
    slug: "personal-care",
    title: "Personal Care",
    description: "Self-care essentials and daily routines.",
  },
  {
    slug: "electronics",
    title: "Electronics",
    description: "VoltHub's department for gadgets and accessories.",
  },
];

const ESSENTIALS_CATEGORIES: CategorySlug[] = [
  "groceries",
  "beverages",
  "snacks",
  "household",
  "personal-care",
];

const ELECTRONICS_CATEGORIES: CategorySlug[] = [
  "electronics",
  "audio",
  "smartwatches",
  "chargers-cables",
  "power-banks",
  "phone-accessories",
  "speakers",
];

function getProductImage(product: Product) {
  return product.image && product.image.startsWith("http")
    ? product.image
    : "/product-placeholder.png";
}

export default function Home() {
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

  const featured = useMemo(() => products.slice(0, 8), [products]);

  const heroPreview = useMemo(() => {
    const priorityOrder: CategorySlug[] = [
      "groceries",
      "beverages",
      "household",
      "personal-care",
      "electronics",
      "audio",
    ];

    const picked: Product[] = [];

    priorityOrder.forEach((slug) => {
      const match = products.find(
        (product) => product.category === slug && !picked.some((item) => item.id === product.id)
      );

      if (match) {
        picked.push(match);
      }
    });

    featured.forEach((product) => {
      if (picked.length < 4 && !picked.some((item) => item.id === product.id)) {
        picked.push(product);
      }
    });

    return picked.slice(0, 4);
  }, [featured, products]);

  const essentialsPicks = useMemo(
    () => products.filter((product) => ESSENTIALS_CATEGORIES.includes(product.category)).slice(0, 4),
    [products]
  );

  const electronicsPicks = useMemo(
    () => products.filter((product) => ELECTRONICS_CATEGORIES.includes(product.category)).slice(0, 3),
    [products]
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-14 pt-4 sm:px-6 sm:pb-16 sm:pt-6">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_38%),linear-gradient(135deg,_rgba(24,24,27,0.98),_rgba(9,9,11,1))] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-8 top-10 h-36 w-36 rounded-full bg-white/6 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[color:var(--accent)]/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:22px_22px] opacity-20" />
        </div>

        <div className="relative grid gap-6 px-4 py-5 sm:px-6 sm:py-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-8 lg:px-8 lg:py-9">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-200">
              VoltHub Market
            </div>
            <h1 className="mt-4 max-w-[12ch] font-serif text-[2.4rem] leading-[0.94] text-white sm:text-5xl lg:text-6xl">
              Everyday essentials, groceries, and gadgets in one place
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-300 sm:text-base">
              Shop groceries, drinks, household items, personal care, and electronics with fast Nairobi delivery and M-Pesa checkout.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/category/groceries"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] transition-transform hover:scale-[1.01]"
              >
                Shop groceries
              </Link>
              <Link
                href="/category/electronics"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Shop electronics
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 text-xs text-zinc-200 sm:grid-cols-3 sm:gap-3 sm:text-sm">
              {TRUST_ITEMS.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3 text-center font-medium backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[26px] border border-white/10 bg-white/6 p-3 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-3">
                {heroPreview.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className={`group overflow-hidden rounded-[22px] border border-white/10 bg-black/20 ${
                      index === 0 ? "col-span-2" : ""
                    }`}
                  >
                    <div className={`relative ${index === 0 ? "aspect-[16/9]" : "aspect-[5/6]"}`}>
                      <Image
                        src={getProductImage(product)}
                        alt={product.name}
                        fill
                        sizes={index === 0 ? "(max-width: 1024px) 100vw, 40vw" : "(max-width: 1024px) 50vw, 20vw"}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-300">
                          {product.category.replace("-", " ")}
                        </div>
                        <div className="mt-1 text-sm font-medium leading-5">{product.name}</div>
                      </div>
                    </div>
                  </Link>
                ))}
                {heroPreview.length === 0 && (
                  <div className="col-span-2 rounded-[22px] border border-dashed border-white/15 bg-black/25 p-5 text-sm text-zinc-300">
                    Fresh essentials and electronics will appear here as soon as the catalog is loaded.
                  </div>
                )}
              </div>

              <div className="mt-3 rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-zinc-200">
                <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-400">Store focus</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span>General shopping first</span>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">
                    Electronics by VoltHub
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 sm:mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Shop faster</div>
            <h2 className="mt-2 font-serif text-2xl text-zinc-900 dark:text-white sm:text-3xl">
              Start with the everyday categories
            </h2>
          </div>
          <Link href="/shop" className="hidden rounded-full border border-black/10 px-4 py-2 text-sm dark:border-white/10 sm:inline-flex">
            Browse full shop
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 lg:grid-cols-3">
          {HOMEPAGE_CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="group rounded-[22px] border border-black/10 bg-white/90 p-4 transition-colors hover:border-[color:var(--accent)] dark:border-white/10 dark:bg-zinc-950/70"
            >
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                Category
              </div>
              <div className="mt-2 font-serif text-xl text-zinc-900 dark:text-white">
                {category.title}
              </div>
              <p className="mt-2 text-sm leading-5 text-zinc-600 dark:text-zinc-400">
                {category.description}
              </p>
              <div className="mt-4 text-sm font-medium text-[color:var(--accent)]">
                Browse now
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:mt-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="rounded-[28px] border border-black/10 bg-white/90 p-4 dark:border-white/10 dark:bg-zinc-950/70 sm:p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Popular now</div>
              <h2 className="mt-2 font-serif text-2xl text-zinc-900 dark:text-white">
                Featured store picks
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Fast-moving items from across groceries, home, personal care, and gadgets.
              </p>
            </div>
            <Link href="/shop" className="rounded-full border border-black/10 px-4 py-2 text-sm dark:border-white/10">
              Shop all
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="mt-6 rounded-[22px] border border-black/10 bg-zinc-50 p-8 text-center dark:border-white/10 dark:bg-black/30">
              <div className="font-serif text-2xl">Products coming soon</div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Browse the store structure now and check back as products go live.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(essentialsPicks.length > 0 ? essentialsPicks : featured.slice(0, 4)).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        <aside className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,20,0.96),rgba(8,8,10,1))] p-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.3)] sm:p-5">
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-400">Electronics department</div>
          <h2 className="mt-2 font-serif text-2xl">VoltHub handles the gadget side</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            When the basket needs earphones, power, audio, or phone accessories, the electronics aisle is still one tap away.
          </p>

          <div className="mt-5 grid gap-3">
            <Link href="/category/electronics" className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium transition-colors hover:bg-white/10">
              Shop all electronics
            </Link>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Link href="/category/audio" className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 transition-colors hover:bg-white/10">
                Audio
              </Link>
              <Link href="/category/chargers-cables" className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 transition-colors hover:bg-white/10">
                Chargers
              </Link>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {(electronicsPicks.length > 0 ? electronicsPicks : featured.slice(0, 3)).map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/6 p-3 transition-colors hover:bg-white/10"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl">
                  <Image
                    src={getProductImage(product)}
                    alt={product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{product.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-400">
                    {product.category.replace("-", " ")}
                  </div>
                </div>
                <div className="text-sm font-semibold text-zinc-200">
                  KES {product.priceKes.toLocaleString()}
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
