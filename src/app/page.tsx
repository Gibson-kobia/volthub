"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductCard } from "../components/product-card";
import { useAuth } from "../components/auth/auth-provider";
import { fetchProducts, type Product } from "../lib/products";
import type { CategorySlug } from "../lib/types";

type CategoryIconName = "leaf" | "cup" | "package" | "milk" | "sparkles" | "heart" | "cookie" | "baby" | "zap" | "tag";

type CategoryLane = {
  label: string;
  description: string;
  href: string;
  icon: CategoryIconName;
  accentColor: string;
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

const CATEGORY_LANES: CategoryLane[] = [
  {
    label: "Fresh Food",
    description: "Produce and pantry",
    href: "/category/groceries",
    icon: "leaf",
    accentColor: "rgba(46,211,160,0.18)",
  },
  {
    label: "Beverages",
    description: "Water, juice, sodas",
    href: "/category/beverages",
    icon: "cup",
    accentColor: "rgba(33,212,253,0.18)",
  },
  {
    label: "Pantry Refill",
    description: "Dry goods, staples",
    href: "/category/groceries",
    icon: "package",
    accentColor: "rgba(255,184,77,0.18)",
  },
  {
    label: "Dairy & Eggs",
    description: "Milk, cheese, eggs",
    href: "/category/groceries",
    icon: "milk",
    accentColor: "rgba(255,255,255,0.09)",
  },
  {
    label: "Cleaning",
    description: "Home and kitchen",
    href: "/category/household",
    icon: "sparkles",
    accentColor: "rgba(47,107,255,0.18)",
  },
  {
    label: "Personal Care",
    description: "Body and grooming",
    href: "/category/personal-care",
    icon: "heart",
    accentColor: "rgba(255,100,130,0.16)",
  },
  {
    label: "Bakery & Snacks",
    description: "Bread, biscuits, crisps",
    href: "/category/snacks",
    icon: "cookie",
    accentColor: "rgba(255,184,77,0.16)",
  },
  {
    label: "Baby Picks",
    description: "For little ones",
    href: "/category/groceries",
    icon: "baby",
    accentColor: "rgba(180,130,255,0.16)",
  },
  {
    label: "Electronics",
    description: "VoltHub department",
    href: "/category/electronics",
    icon: "zap",
    accentColor: "rgba(33,212,253,0.18)",
  },
  {
    label: "Today's Picks",
    description: "Value finds this week",
    href: "/offers",
    icon: "tag",
    accentColor: "rgba(255,184,77,0.20)",
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

function CategoryIcon({ icon }: { icon: CategoryIconName }) {
  const cls = "w-6 h-6";
  switch (icon) {
    case "leaf":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      );
    case "cup":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" x2="6" y1="2" y2="4" />
          <line x1="10" x2="10" y1="2" y2="4" />
          <line x1="14" x2="14" y1="2" y2="4" />
        </svg>
      );
    case "package":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16.5 9.4 7.55 4.24" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="M3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" x2="12" y1="22.08" y2="12" />
        </svg>
      );
    case "milk":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2h8" />
          <path d="M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.888A4 4 0 0 0 7 10.067V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.933a4 4 0 0 0-.672-2.219l-.656-.888A4 4 0 0 1 15 4.789V2" />
          <path d="M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0" />
        </svg>
      );
    case "sparkles":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          <path d="M20 3v4" />
          <path d="M22 5h-4" />
          <path d="M4 17v2" />
          <path d="M5 18H3" />
        </svg>
      );
    case "heart":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
    case "cookie":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
          <path d="M8.5 8.5v.01" />
          <path d="M16 15.5v.01" />
          <path d="M12 12v.01" />
          <path d="M11 17v.01" />
          <path d="M7 14v.01" />
        </svg>
      );
    case "baby":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="3" />
          <path d="M12 8v7" />
          <path d="m9 12-2 5h10l-2-5" />
          <path d="M9 21h6" />
        </svg>
      );
    case "zap":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
        </svg>
      );
    case "tag":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
          <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    default: {
      const _exhaustive: never = icon;
      void _exhaustive;
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    }
  }
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
                Order everyday essentials before 6PM for same-day delivery. Express 2-4 hour coverage is available in selected areas.
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

      <section id="categories" className="mt-10 sm:mt-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
              Shop by category
            </div>
            <h2 className="mt-2 font-serif text-2xl leading-tight text-white sm:text-3xl">
              Pick an aisle
            </h2>
          </div>
          <Link
            href="/shop"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-white/4 px-5 text-sm font-semibold text-white transition-colors hover:border-[color:var(--glow)] hover:bg-white/8"
          >
            Browse full shop
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 sm:gap-3">
          {CATEGORY_LANES.map((lane) => (
            <Link
              key={lane.label}
              href={lane.href}
              style={{ background: `linear-gradient(135deg, ${lane.accentColor}, rgba(24,28,32,0.96))` }}
              className="group flex flex-col items-start gap-3 rounded-[20px] border border-white/8 p-4 transition-all duration-200 hover:border-white/14 hover:-translate-y-0.5 hover:shadow-[0_10px_32px_rgba(0,0,0,0.28)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/10 bg-white/8 text-white">
                <CategoryIcon icon={lane.icon} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{lane.label}</div>
                <div className="mt-0.5 text-[11px] leading-4 text-white/54">{lane.description}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 sm:mt-8">
        <div className="rounded-[24px] border border-[color:var(--warning)]/24 bg-[linear-gradient(135deg,rgba(255,184,77,0.09),rgba(24,28,32,0.96))] px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--warning)]">
                Value picks
              </div>
              <h2 className="mt-2 font-serif text-xl text-white sm:text-2xl">
                Today&apos;s deals across the store
              </h2>
              <p className="mt-1.5 max-w-xl text-xs leading-5 text-white/64 sm:text-sm sm:leading-6">
                Curated picks across groceries, household items, snacks, and electronics. Priced for fast movement.
              </p>
            </div>
            <Link
              href="/offers"
              className="inline-flex min-h-10 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--warning)] px-6 text-xs font-semibold text-[#101418] transition-opacity hover:opacity-90"
            >
              See today&apos;s deals
            </Link>
          </div>
        </div>
      </section>

      <section id="delivery" className="mt-10 rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,28,32,0.88),rgba(18,20,23,0.96))] px-5 py-6 sm:mt-12 sm:px-6 sm:py-7">
        <SectionHeader
          eyebrow="Fast delivery and trust"
          title="Built for convenience-first shopping"
          description="Zora is set up for fast Nairobi ordering first, then dependable next-day delivery outside the city as coverage expands."
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

      <section className="mt-10 sm:mt-12">
        <SectionHeader
          eyebrow="Featured daily essentials"
          title="The core store, curated for quick decisions"
          description="Start with the everyday side of Zora: pantry restocks, drinks, snacks, and fast-moving staples that belong in a minimart first."
          ctaHref="/category/groceries"
          ctaLabel="Shop essentials"
        />

        <div className="mt-6 grid gap-3 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(155deg,rgba(47,107,255,0.14),rgba(18,20,23,0.96))] p-5 sm:p-6">
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/48">
              Everyday mission
            </div>
            <h3 className="mt-2.5 max-w-[12ch] font-serif text-3xl leading-tight text-white sm:text-4xl">
              Stock the kitchen, top up the fridge, keep the week moving.
            </h3>
            <p className="mt-3.5 max-w-md text-xs leading-5 text-white/72 sm:text-sm sm:leading-6">
              Zora is designed to make repeat shopping feel fast and reliable, not overwhelming. Browse cleanly, pay quickly, and get a clear delivery promise.
            </p>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-[20px] border border-white/6 bg-white/[0.04] p-3.5 text-xs leading-5 text-white/72">
                Same-day Nairobi delivery on daily essentials when ordered before 6PM.
              </div>
              <div className="rounded-[20px] border border-white/6 bg-white/[0.04] p-3.5 text-xs leading-5 text-white/72">
                WhatsApp support and real-time order updates after confirmation.
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
          title="Fast picks for quick consumption"
          description="A lighter, swipe-friendly row for the products shoppers usually want to add quickly without slowing down the rest of the basket."
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

      <section className="mt-10 grid gap-3.5 sm:mt-12 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,28,32,0.88),rgba(18,20,23,0.96))] p-5 sm:p-6">
          <SectionHeader
            eyebrow="Household and personal care"
            title="Practical basics for home and routine"
            description="This part of the store stays clear and no-nonsense: cleaning, household restocks, and personal care without unnecessary clutter."
            ctaHref="/category/household"
            ctaLabel="Shop home basics"
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/48">
                Service areas
              </div>
              <p className="mt-2.5 text-xs leading-5 text-white/64">
                Nairobi orders move same-day, while deliveries outside Nairobi roll out next-day through dependable courier coverage.
              </p>
            </div>
            <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-4 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/48">
                Payment flexibility
              </div>
              <p className="mt-2.5 text-xs leading-5 text-white/64">
                Use M-Pesa, card payments, pay on pickup, or cash on delivery where the route supports it.
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
              Electronics stay premium, but clearly inside the Zora store.
            </h2>
            <p className="mt-3.5 text-xs leading-5 text-white/72 sm:text-sm sm:leading-6">
              VoltHub remains the partner-led electronics department for chargers, audio, power, wearables, and quick-access tech. It supports the basket without taking over the brand.
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

      <section className="mt-10 sm:mt-12">
        <SectionHeader
          eyebrow="Popular now"
          title="Best sellers and fast-moving picks"
          description="Use this section when you already know you want the products other shoppers reach for first across the store."
          ctaHref="/shop"
          ctaLabel="See all products"
        />

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
          {bestSellers.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {!loading && bestSellers.length === 0 ? (
            <div className="col-span-2 xl:col-span-4 rounded-[22px] border border-dashed border-white/12 bg-white/[0.02] p-6 text-xs text-white/56">
              The storefront is ready; featured products will appear here as soon as catalog data is available.
            </div>
          ) : null}
        </div>
      </section>

      <section id="support" className="mt-10 rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,28,32,0.88),rgba(18,20,23,0.96))] px-5 py-6 sm:mt-12 sm:px-6 sm:py-7">
        <SectionHeader
          eyebrow="Reassurance"
          title="Clear promises, real local support"
          description="Trust comes from how the store works: clear service areas, verified payment options, direct support, and fast order updates after checkout."
        />

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            "M-Pesa STK push, card payments, pay on pickup, and cash on delivery",
            "Instant order confirmation with real-time WhatsApp delivery updates",
            "No-fakes policy and fast issue resolution from the local team",
            "Nairobi-based operations with same-day focus and nationwide expansion",
          ].map((item) => (
            <div key={item} className="rounded-[20px] border border-white/6 bg-white/[0.03] p-4 text-xs leading-5 text-white/72 backdrop-blur-sm">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(47,107,255,0.18),rgba(18,20,23,0.96))] px-5 py-7 sm:mt-12 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/48">
              Ready to order
            </div>
            <h2 className="mt-2.5 max-w-[14ch] font-serif text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
              Start shopping with a cleaner, faster Nairobi-first store.
            </h2>
            <p className="mt-3.5 text-xs leading-5 text-white/72 sm:text-sm sm:leading-6">
              Shop essentials first, add VoltHub electronics when needed, and check out with M-Pesa or the payment method that works best for your order.
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
