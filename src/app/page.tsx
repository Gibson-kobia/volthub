"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "../components/product-card";
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
  "Same-day in Nairobi before 6PM",
  "M-Pesa, cards, cash on delivery",
  "WhatsApp updates after checkout",
];

const TRUST_STRIP = [
  {
    title: "2-4 hour express",
    description: "Selected Nairobi zones for urgent top-ups and last-minute restocks.",
  },
  {
    title: "Secure checkout",
    description: "M-Pesa STK push, cards, pay on pickup, and cash on delivery where available.",
  },
  {
    title: "Real local support",
    description: "WhatsApp, phone, and email from a Nairobi-based team with quick issue resolution.",
  },
];

const CATEGORY_CARDS: CategoryCard[] = [
  {
    slug: "groceries",
    title: "Daily essentials",
    eyebrow: "Pantry and restock",
    description: "Fresh top-ups, staples, and the basics you need to keep the week moving.",
    href: "/category/groceries",
    className: "sm:col-span-2 bg-[linear-gradient(135deg,rgba(47,107,255,0.22),rgba(24,28,32,0.92))]",
  },
  {
    slug: "beverages",
    title: "Drinks and quick picks",
    eyebrow: "Fast consumption",
    description: "Water, juices, sodas, and cold-stock favourites for easy replenishment.",
    href: "/category/beverages",
    className: "bg-[linear-gradient(180deg,rgba(255,184,77,0.18),rgba(24,28,32,0.94))]",
  },
  {
    slug: "household",
    title: "Home basics",
    eyebrow: "Practical everyday",
    description: "Cleaning, utility, and household essentials laid out for fast browsing.",
    href: "/category/household",
    className: "bg-[linear-gradient(180deg,rgba(46,211,160,0.18),rgba(24,28,32,0.94))]",
  },
  {
    slug: "electronics",
    title: "VoltHub electronics",
    eyebrow: "Partner department",
    description: "Chargers, audio, and devices from VoltHub inside the same checkout flow.",
    href: "/category/electronics",
    className: "sm:col-span-2 lg:col-span-1 bg-[linear-gradient(135deg,rgba(33,212,253,0.22),rgba(24,28,32,0.92))]",
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
              Zora brings groceries, drinks, household essentials, personal care, and VoltHub electronics together for same-day delivery, M-Pesa checkout, and quick WhatsApp support.
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

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {HERO_METRICS.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white/88 backdrop-blur"
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
                Order everyday essentials before 6PM for same-day delivery. Express 2-4 hour coverage is available in selected areas.
              </p>
            </div>

            <div className="grid h-full grid-cols-2 gap-3 pt-28 sm:gap-4 sm:pt-20">
              {heroPreview.length > 0 ? (
                heroPreview.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className={`group relative overflow-hidden rounded-[24px] border border-white/10 bg-[#101418] shadow-[0_20px_40px_rgba(0,0,0,0.24)] transition-transform duration-300 hover:-translate-y-1 ${
                      index === 0 ? "col-span-2 aspect-[16/10]" : "aspect-[5/6]"
                    }`}
                  >
                    <Image
                      src={getProductImage(product)}
                      alt={product.name}
                      fill
                      sizes={index === 0 ? "(max-width: 1024px) 100vw, 42vw" : "(max-width: 1024px) 50vw, 20vw"}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,0.08),rgba(10,10,11,0.84))]" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/65">
                        {product.category.replace("-", " ")}
                      </div>
                      <div className="mt-2 text-base font-semibold text-white sm:text-lg">
                        {product.name}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-2 flex h-full min-h-[260px] flex-col justify-between rounded-[24px] border border-dashed border-white/14 bg-black/24 p-5">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--glow)]">
                      Zora mix
                    </div>
                    <div className="mt-3 max-w-sm text-2xl font-semibold text-white">
                      Everyday shopping first, with VoltHub electronics inside the same store.
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-[color:var(--muted)]">
                      Groceries, drinks, household items, and personal care.
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-[color:var(--muted)]">
                      Chargers, audio, and electronics from VoltHub when you need them.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="mt-10 sm:mt-12">
        <SectionHeader
          eyebrow="Quick category shortcuts"
          title="Move straight to the aisle you came for"
          description="The homepage is organised around the fast-moving parts of the store so you can shop essentials quickly without marketplace clutter."
          ctaHref="/shop"
          ctaLabel="Browse full shop"
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_CARDS.map((category) => (
            <Link
              key={category.slug}
              href={category.href}
              className={`group relative overflow-hidden rounded-[28px] border border-[color:var(--border)] p-5 transition-transform duration-300 hover:-translate-y-1 ${category.className}`}
            >
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(10,10,11,0.34))]" />
              <div className="relative flex h-full min-h-[220px] flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/65">
                    {category.eyebrow}
                  </div>
                  <h3 className="mt-3 max-w-[12ch] font-serif text-3xl leading-tight text-white">
                    {category.title}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-[#d2d8e0]">
                    {category.description}
                  </p>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  Browse category
                  <span className="transition-transform group-hover:translate-x-1">-&gt;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="delivery" className="mt-10 rounded-[30px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(24,28,32,0.96),rgba(18,20,23,0.98))] px-5 py-6 sm:mt-12 sm:px-7 sm:py-7">
        <SectionHeader
          eyebrow="Fast delivery and trust"
          title="Built for convenience-first shopping"
          description="Zora is set up for fast Nairobi ordering first, then dependable next-day delivery outside the city as coverage expands."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {TRUST_STRIP.map((item) => (
            <div key={item.title} className="rounded-[24px] border border-white/8 bg-white/4 p-5">
              <div className="text-lg font-semibold text-white">{item.title}</div>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 sm:mt-12">
        <SectionHeader
          eyebrow="Featured daily essentials"
          title="The core store, curated for quick decisions"
          description="Start with the everyday side of Zora: pantry restocks, drinks, snacks, and fast-moving staples that belong in a minimart first."
          ctaHref="/category/groceries"
          ctaLabel="Shop essentials"
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[30px] border border-[color:var(--border)] bg-[linear-gradient(155deg,rgba(47,107,255,0.18),rgba(18,20,23,0.98))] p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--glow)]">
              Everyday mission
            </div>
            <h3 className="mt-3 max-w-[12ch] font-serif text-4xl leading-tight text-white">
              Stock the kitchen, top up the fridge, keep the week moving.
            </h3>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#d7dde6]">
              Zora is designed to make repeat shopping feel fast and reliable, not overwhelming. Browse cleanly, pay quickly, and get a clear delivery promise.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-white/88">
                Same-day Nairobi delivery on daily essentials when ordered before 6PM.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm text-white/88">
                WhatsApp support and real-time order updates after confirmation.
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(dailyEssentials.length > 0 ? dailyEssentials : bestSellers.slice(0, 4)).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {!loading && dailyEssentials.length === 0 && bestSellers.length === 0 ? (
              <div className="sm:col-span-2 rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/3 p-8 text-sm text-[color:var(--muted)]">
                Product cards will populate here once catalog data is available from Supabase.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-10 sm:mt-12">
        <SectionHeader
          eyebrow="Snacks and beverages"
          title="Fast picks for quick consumption"
          description="A lighter, swipe-friendly row for the products shoppers usually want to add quickly without slowing down the rest of the basket."
          ctaHref="/category/snacks"
          ctaLabel="Shop snacks"
        />

        <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-2">
          {(fastPicks.length > 0 ? fastPicks : bestSellers.slice(0, 6)).map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group min-w-[260px] snap-start rounded-[26px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(24,28,32,0.96),rgba(18,20,23,0.98))] p-4 transition-transform duration-300 hover:-translate-y-1 sm:min-w-[300px]"
            >
              <div className="relative aspect-[5/4] overflow-hidden rounded-[22px]">
                <Image
                  src={getProductImage(product)}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 80vw, 280px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,11,0.04),rgba(10,10,11,0.7))]" />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--warning)]">
                    {product.category.replace("-", " ")}
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">{product.name}</div>
                </div>
                <div className="text-sm font-semibold text-white">
                  KES {product.priceKes.toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:mt-12 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="rounded-[30px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(24,28,32,0.94),rgba(18,20,23,0.98))] p-6">
          <SectionHeader
            eyebrow="Household and personal care"
            title="Practical basics for home and routine"
            description="This part of the store stays clear and no-nonsense: cleaning, household restocks, and personal care without unnecessary clutter."
            ctaHref="/category/household"
            ctaLabel="Shop home basics"
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/8 bg-white/4 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--success)]">
                Service areas
              </div>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                Nairobi orders move same-day, while deliveries outside Nairobi roll out next-day through dependable courier coverage.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/4 p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--success)]">
                Payment flexibility
              </div>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                Use M-Pesa, card payments, pay on pickup, or cash on delivery where the route supports it.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(householdPicks.length > 0 ? householdPicks : bestSellers.slice(0, 4)).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(145deg,rgba(33,212,253,0.12),rgba(24,28,32,0.98))] px-5 py-6 sm:mt-12 sm:px-7 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="max-w-xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--glow)]">
              VoltHub electronics department
            </div>
            <h2 className="mt-3 max-w-[12ch] font-serif text-4xl leading-tight text-white">
              Electronics stay premium, but clearly inside the Zora store.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#d7dde6] sm:text-base">
              VoltHub remains the partner-led electronics department for chargers, audio, power, wearables, and quick-access tech. It supports the basket without taking over the brand.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/category/electronics"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#101418] transition-opacity hover:opacity-90"
              >
                Shop VoltHub electronics
              </Link>
              <Link
                href="/category/chargers-cables"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/12 bg-white/6 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Browse chargers and cables
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {(electronicsPicks.length > 0 ? electronicsPicks : bestSellers.slice(0, 3)).map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group rounded-[26px] border border-white/10 bg-[#11161b]/90 p-4 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[20px]">
                  <Image
                    src={getProductImage(product)}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 90vw, 240px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--glow)]">
                  {product.category.replace("-", " ")}
                </div>
                <div className="mt-2 text-lg font-semibold text-white">{product.name}</div>
                <div className="mt-2 text-sm text-[#d7dde6]">KES {product.priceKes.toLocaleString()}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 sm:mt-12">
        <SectionHeader
          eyebrow="Popular now"
          title="Best sellers and fast-moving picks"
          description="Use this section when you already know you want the products other shoppers reach for first across the store."
          ctaHref="/shop"
          ctaLabel="See all products"
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {bestSellers.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {!loading && bestSellers.length === 0 ? (
            <div className="sm:col-span-2 xl:col-span-4 rounded-[24px] border border-dashed border-[color:var(--border)] bg-white/3 p-8 text-sm text-[color:var(--muted)]">
              The storefront is ready; featured products will appear here as soon as catalog data is available.
            </div>
          ) : null}
        </div>
      </section>

      <section id="support" className="mt-10 rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(24,28,32,0.96),rgba(18,20,23,0.98))] px-5 py-6 sm:mt-12 sm:px-7 sm:py-8">
        <SectionHeader
          eyebrow="Reassurance"
          title="Clear promises, real local support"
          description="Trust comes from how the store works: clear service areas, verified payment options, direct support, and fast order updates after checkout."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            "M-Pesa STK push, card payments, pay on pickup, and cash on delivery",
            "Instant order confirmation with real-time WhatsApp delivery updates",
            "No-fakes policy and fast issue resolution from the local team",
            "Nairobi-based operations with same-day focus and nationwide expansion",
          ].map((item) => (
            <div key={item} className="rounded-[24px] border border-white/8 bg-white/4 p-5 text-sm leading-6 text-[#d7dde6]">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[32px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(47,107,255,0.24),rgba(18,20,23,0.98))] px-5 py-8 sm:mt-12 sm:px-7 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--glow)]">
              Ready to order
            </div>
            <h2 className="mt-3 max-w-[14ch] font-serif text-4xl leading-tight text-white sm:text-5xl">
              Start shopping with a cleaner, faster Nairobi-first store.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[#d7dde6] sm:text-base">
              Shop essentials first, add VoltHub electronics when needed, and check out with M-Pesa or the payment method that works best for your order.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex min-h-13 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#101418] transition-opacity hover:opacity-90"
            >
              Start shopping
            </Link>
            <Link
              href="#categories"
              className="inline-flex min-h-13 items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Browse categories
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
