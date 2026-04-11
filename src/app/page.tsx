"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductCard } from "../components/product-card";
import { useAuth } from "../components/auth/auth-provider";
import { fetchProducts, type Product } from "../lib/products";
import type { CategorySlug } from "../lib/types";

type CategoryCard = {
  slug: CategorySlug;
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  className: string;
};

const HERO_METRICS = [
  "Same-day Nairobi before 6PM",
  "M-Pesa, card, or COD",
  "Live WhatsApp updates",
];

const TRUST_STRIP = [
  {
    title: "2-4 hour express",
    description: "Selected Nairobi zones.",
  },
  {
    title: "Secure checkout",
    description: "M-Pesa STK, card, pickup, or COD.",
  },
  {
    title: "Real local support",
    description: "Nairobi team on WhatsApp and phone.",
  },
];

const CATEGORY_CARDS: CategoryCard[] = [
  {
    slug: "groceries",
    title: "Daily essentials",
    eyebrow: "Pantry restock",
    description: "Staples and fresh top-ups.",
    href: "/category/groceries",
    className: "sm:col-span-2 bg-[linear-gradient(135deg,rgba(47,107,255,0.28),rgba(24,28,32,0.92))]",
  },
  {
    slug: "beverages",
    title: "Drinks and quick picks",
    eyebrow: "Cold stock",
    description: "Water, juice, soda, and add-ons.",
    href: "/category/beverages",
    className: "bg-[linear-gradient(180deg,rgba(255,184,77,0.24),rgba(24,28,32,0.94))]",
  },
  {
    slug: "household",
    title: "Home basics",
    eyebrow: "Practical everyday",
    description: "Cleaning and utility essentials.",
    href: "/category/household",
    className: "bg-[linear-gradient(180deg,rgba(46,211,160,0.24),rgba(24,28,32,0.94))]",
  },
  {
    slug: "electronics",
    title: "VoltHub electronics",
    eyebrow: "Partner department",
    description: "Chargers, audio, and devices in one checkout.",
    href: "/category/electronics",
    className: "sm:col-span-2 lg:col-span-1 bg-[linear-gradient(135deg,rgba(33,212,253,0.28),rgba(24,28,32,0.92))]",
  },
];

const FAST_PICK_CATEGORIES: CategorySlug[] = ["snacks", "beverages"];
const DAILY_CATEGORIES: CategorySlug[] = ["groceries", "beverages", "snacks"];
const HOUSEHOLD_CATEGORIES: CategorySlug[] = ["household", "personal-care"];
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

function HeroSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-[22px] border border-white/14 bg-white/6 pl-4 pr-1.5 py-1.5 backdrop-blur-sm"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0 text-white/48"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search groceries, drinks, household items..."
        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
        aria-label="Search products"
      />
      <button
        type="submit"
        className="inline-flex flex-shrink-0 items-center justify-center rounded-[18px] bg-[color:var(--accent)] px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        Search
      </button>
    </form>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
          {eyebrow}
        </div>
        <h2 className="mt-3 font-serif text-3xl leading-tight text-white sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)] sm:text-base">
          {description}
        </p>
      </div>
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/4 px-5 text-sm font-semibold text-white transition-colors hover:border-[color:var(--glow)] hover:bg-white/8"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}

export default function Home() {
  const { authReady, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authReady) return;

    let mounted = true;

    async function load() {
      const data = await fetchProducts();
      if (!mounted) return;
      setProducts(data);
      setLoading(false);
    }

    setLoading(true);
    load();

    return () => {
      mounted = false;
    };
  }, [authReady, user?.id]);

  const heroPreview = useMemo(() => {
    const priority: CategorySlug[] = ["groceries", "beverages", "household", "electronics"];
    const selected: Product[] = [];

    priority.forEach((slug) => {
      const match = products.find(
        (product) => product.category === slug && !selected.some((item) => item.id === product.id)
      );

      if (match) {
        selected.push(match);
      }
    });

    return selected.slice(0, 4);
  }, [products]);

  const dailyEssentials = useMemo(
    () => products.filter((product) => DAILY_CATEGORIES.includes(product.category)).slice(0, 4),
    [products]
  );

  const fastPicks = useMemo(
    () => products.filter((product) => FAST_PICK_CATEGORIES.includes(product.category)).slice(0, 6),
    [products]
  );

  const householdPicks = useMemo(
    () => products.filter((product) => HOUSEHOLD_CATEGORIES.includes(product.category)).slice(0, 4),
    [products]
  );

  const electronicsPicks = useMemo(
    () => products.filter((product) => ELECTRONICS_CATEGORIES.includes(product.category)).slice(0, 3),
    [products]
  );

  const bestSellers = useMemo(() => products.slice(0, 8), [products]);

  const categoryCounts = useMemo(() => {
    return products.reduce(
      (acc, product) => {
        acc[product.category] = (acc[product.category] ?? 0) + 1;
        return acc;
      },
      {} as Partial<Record<CategorySlug, number>>
    );
  }, [products]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-6">
      <section className="relative overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(10,10,11,0.92),rgba(18,20,23,0.98))] px-5 py-6 shadow-[0_32px_120px_rgba(0,0,0,0.45)] sm:px-7 sm:py-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-8 h-48 w-48 rounded-full bg-[color:var(--accent)]/18 blur-3xl" />
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-[color:var(--glow)]/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-[color:var(--success)]/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px] opacity-25" />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[color:var(--success)]" />
              Nairobi-first minimart
            </div>
            <h1 className="mt-5 max-w-[12ch] text-balance font-serif text-[2.9rem] leading-[0.92] text-white sm:text-6xl lg:text-[4.5rem]">
              Fast everyday shopping in Nairobi
            </h1>
            <p className="mt-5 max-w-2xl text-balance text-base leading-7 text-[#d7dde6] sm:text-lg">
              Groceries, drinks, home basics, and VoltHub electronics in one checkout.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/shop"
                className="inline-flex min-h-13 items-center justify-center rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(47,107,255,0.35)] transition-transform hover:scale-[1.01]"
              >
                Start shopping
              </Link>
              <Link
                href="#categories"
                className="inline-flex min-h-13 items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Browse categories
              </Link>
            </div>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
              {HERO_METRICS.map((item) => (
                <div
                  key={item}
                  className="rounded-[18px] border border-white/6 bg-white/[0.05] px-3.5 py-3 text-xs font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/10 hover:bg-white/8"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.22em] text-[#9fb3cf] sm:text-sm sm:tracking-[0.24em]">
              <span>Order before 6PM</span>
              <span className="text-white/24">/</span>
              <span>M-Pesa STK push</span>
              <span className="text-white/24">/</span>
              <span>WhatsApp updates</span>
            </div>

            <div className="mt-6">
              <HeroSearchBar />
            </div>
          </div>

          <div className="relative min-h-[420px] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 backdrop-blur sm:p-5">
            <div className="absolute right-4 top-4 z-20 max-w-[220px] rounded-[22px] border border-white/12 bg-[#11161b]/92 p-4 shadow-[0_22px_50px_rgba(0,0,0,0.32)] backdrop-blur">
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--warning)]">
                Delivery window
              </div>
              <div className="mt-2 text-xl font-semibold text-white">
                Same-day Nairobi delivery
              </div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Order before 6PM for same-day delivery. Express 2-4 hour zones available.
              </p>
            </div>

            <div className="grid h-full grid-cols-2 gap-2.5 pt-24 sm:gap-3 sm:pt-16">
              {heroPreview.length > 0 ? (
                heroPreview.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className={`group relative overflow-hidden rounded-[20px] border border-white/8 bg-black shadow-[0_12px_32px_rgba(0,0,0,0.32)] transition-all duration-300 hover:border-white/12 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 ${
                      index === 0 ? "col-span-2 aspect-[16/9]" : "aspect-[5/6]"
                    }`}
                  >
                    <Image
                      src={getProductImage(product)}
                      alt={product.name}
                      fill
                      sizes={index === 0 ? "(max-width: 1024px) 100vw, 42vw" : "(max-width: 1024px) 50vw, 20vw"}
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.08]"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,0.08),rgba(10,10,11,0.72))]" />
                    <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                      <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/56">
                        {product.category.replace("-", " ")}
                      </div>
                      <div className="mt-1.5 text-sm font-semibold text-white sm:text-base">
                        {product.name}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-2 flex h-full min-h-[240px] flex-col justify-between rounded-[22px] border border-dashed border-white/12 bg-white/[0.02] p-4 sm:p-5">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/48">
                      Zora mix
                    </div>
                    <div className="mt-3 max-w-sm text-xl font-semibold text-white sm:text-2xl">
                      Everyday shopping first, with VoltHub electronics inside the same store.
                    </div>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="rounded-[18px] border border-white/6 bg-white/[0.04] p-3.5 text-xs text-white/64">
                      Groceries, drinks, household items, and personal care.
                    </div>
                    <div className="rounded-[18px] border border-white/6 bg-white/[0.04] p-3.5 text-xs text-white/64">
                      Chargers, audio, and electronics from VoltHub when you need them.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 sm:mt-12">
        <SectionHeader
          eyebrow="Popular now"
          title="Fast-moving picks"
          description="Top products shoppers add first."
          ctaHref="/shop"
          ctaLabel="See all products"
        />

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
          {bestSellers.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {!loading && bestSellers.length === 0 ? (
            <div className="col-span-2 xl:col-span-4 rounded-[22px] border border-dashed border-white/12 bg-white/[0.02] p-6 text-xs text-white/56">
              Featured products appear here once catalog data is available.
            </div>
          ) : null}
        </div>
      </section>

      <section id="categories" className="mt-10 sm:mt-12">
        <SectionHeader
          eyebrow="Quick category shortcuts"
          title="Go straight to your aisle"
          description="Tap a category and add to basket fast."
          ctaHref="/shop"
          ctaLabel="Browse full shop"
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_CARDS.map((category) => {
            const itemCount = categoryCounts[category.slug] ?? 0;

            return (
              <Link
                key={category.slug}
                href={category.href}
                className={`group relative overflow-hidden rounded-[24px] border border-white/8 p-5 transition-all duration-300 active:scale-[0.985] hover:border-white/16 hover:-translate-y-0.5 hover:shadow-[0_16px_48px_rgba(0,0,0,0.28)] ${category.className}`}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-opacity group-hover:opacity-90" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(10,10,11,0.58))]" />
                <div className="relative flex h-full min-h-[220px] flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/52">
                        {category.eyebrow}
                      </div>
                      <h3 className="mt-2.5 max-w-[11ch] font-serif text-2xl leading-tight text-white sm:text-[1.75rem]">
                        {category.title}
                      </h3>
                      <p className="mt-2.5 max-w-xs text-[13px] leading-5 text-white/72">
                        {category.description}
                      </p>
                    </div>
                    <div className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/84">
                      {itemCount > 0 ? `${itemCount} items` : "Shop"}
                    </div>
                  </div>
                  <div className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90 transition-colors group-hover:border-white/24 group-hover:bg-white/14 group-hover:text-white">
                    Tap to shop
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-10 sm:mt-12">
        <SectionHeader
          eyebrow="Featured essentials"
          title="Your core minimart basket"
          description="Restock everyday essentials fast."
          ctaHref="/category/groceries"
          ctaLabel="Shop essentials"
        />

        <div className="mt-6 grid gap-3 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(155deg,rgba(47,107,255,0.14),rgba(18,20,23,0.96))] p-5 sm:p-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/48">
              Everyday mission
            </div>
            <h3 className="mt-2.5 max-w-[12ch] font-serif text-3xl leading-tight text-white sm:text-4xl">
              Stock the kitchen. Top up the fridge.
            </h3>
            <p className="mt-3.5 max-w-md text-xs leading-5 text-white/72 sm:text-sm sm:leading-6">
              Built for repeat orders: browse fast, pay fast, clear delivery windows.
            </p>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-[20px] border border-white/6 bg-white/[0.04] p-3.5 text-xs leading-5 text-white/72">
                Same-day Nairobi delivery before 6PM.
              </div>
              <div className="rounded-[20px] border border-white/6 bg-white/[0.04] p-3.5 text-xs leading-5 text-white/72">
                WhatsApp support with live order updates.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {(dailyEssentials.length > 0 ? dailyEssentials : bestSellers.slice(0, 4)).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {!loading && dailyEssentials.length === 0 && bestSellers.length === 0 ? (
              <div className="col-span-2 rounded-[22px] border border-dashed border-white/12 bg-white/[0.02] p-6 text-xs text-white/56">
                Product cards will populate here once catalog data is available from Supabase.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-10 sm:mt-12">
        <SectionHeader
          eyebrow="Snacks and beverages"
          title="Quick add-ons"
          description="Swipe and add in seconds."
          ctaHref="/category/snacks"
          ctaLabel="Shop snacks"
        />

        <div className="mt-6 flex snap-x gap-3 overflow-x-auto pb-2">
          {(fastPicks.length > 0 ? fastPicks : bestSellers.slice(0, 6)).map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group min-w-[240px] snap-start rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,28,32,0.92),rgba(18,20,23,0.96))] p-3.5 transition-all duration-300 hover:border-white/12 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.32)] sm:min-w-[280px]"
            >
              <div className="relative aspect-[4/3.2] overflow-hidden rounded-[18px] bg-black">
                <Image
                  src={getProductImage(product)}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 70vw, 250px"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.08]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,0.04),rgba(10,10,11,0.6))]" />
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/48">
                    {product.category.replace("-", " ")}
                  </div>
                  <div className="mt-1.5 text-sm font-semibold leading-tight text-white">
                    {product.name}
                  </div>
                </div>
                <div className="flex-shrink-0 text-xs font-semibold text-white/88">
                  {Math.floor(product.priceKes / 1000)}K
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="delivery" className="mt-10 rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,28,32,0.88),rgba(18,20,23,0.96))] px-5 py-6 sm:mt-12 sm:px-6 sm:py-7">
        <SectionHeader
          eyebrow="Fast delivery and trust"
          title="Fast, clear, reliable"
          description="Short promises that hold."
        />
        <div className="mt-6 grid gap-3 lg:grid-cols-3">
          {TRUST_STRIP.map((item) => (
            <div key={item.title} className="rounded-[20px] border border-white/6 bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:bg-white/[0.06]">
              <div className="text-base font-semibold text-white">{item.title}</div>
              <p className="mt-2.5 text-xs leading-5 text-white/64">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-3.5 sm:mt-12 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,28,32,0.88),rgba(18,20,23,0.96))] p-5 sm:p-6">
          <SectionHeader
            eyebrow="Household and personal care"
            title="Home and routine basics"
            description="Cleaning and care essentials, quickly."
            ctaHref="/category/household"
            ctaLabel="Shop home basics"
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/48">
                Service areas
              </div>
              <p className="mt-2.5 text-xs leading-5 text-white/64">
                Nairobi same-day, next-day outside the city.
              </p>
            </div>
            <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/48">
                Payment flexibility
              </div>
              <p className="mt-2.5 text-xs leading-5 text-white/64">
                M-Pesa, card, pickup, or COD.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {(householdPicks.length > 0 ? householdPicks : bestSellers.slice(0, 4)).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[28px] border border-white/8 bg-[linear-gradient(145deg,rgba(33,212,253,0.08),rgba(24,28,32,0.96))] px-5 py-6 sm:mt-12 sm:px-6 sm:py-7">
        <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="max-w-xl">
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/48">
              VoltHub electronics department
            </div>
            <h2 className="mt-2.5 max-w-[12ch] font-serif text-3xl leading-tight text-white sm:text-4xl">
              Premium electronics, same Zora basket.
            </h2>
            <p className="mt-3.5 text-xs leading-5 text-white/72 sm:text-sm sm:leading-6">
              Chargers, audio, power, and wearables in the same checkout.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Link
                href="/category/electronics"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-xs font-semibold text-[#101418] transition-all hover:scale-[1.02]"
              >
                Shop VoltHub
              </Link>
              <Link
                href="/category/chargers-cables"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-xs font-semibold text-white transition-colors hover:bg-white/10 hover:border-white/12"
              >
                Chargers &amp; cables
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(electronicsPicks.length > 0 ? electronicsPicks : bestSellers.slice(0, 3)).map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group relative overflow-hidden rounded-[22px] border border-white/8 bg-black transition-all duration-300 hover:border-white/12 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.32)]"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={getProductImage(product)}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 90vw, 240px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.08]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(10,10,11,0.6))]" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/56">
                    {product.category.replace("-", " ")}
                  </div>
                  <div className="mt-1.5 text-xs font-semibold text-white">{product.name}</div>
                  <div className="mt-1.5 text-[11px] text-white/88">KES {product.priceKes.toLocaleString()}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(47,107,255,0.18),rgba(18,20,23,0.96))] px-5 py-7 sm:mt-12 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/48">
              Ready to order
            </div>
            <h2 className="mt-2.5 max-w-[14ch] font-serif text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
              Start your basket now.
            </h2>
            <p className="mt-3.5 text-xs leading-5 text-white/72 sm:text-sm sm:leading-6">
              Shop essentials first, then add electronics.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-xs font-semibold text-[#101418] transition-all hover:scale-[1.02]"
            >
              Start shopping
            </Link>
            <Link
              href="#categories"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 text-xs font-semibold text-white transition-colors hover:bg-white/10 hover:border-white/12"
            >
              Browse categories
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
