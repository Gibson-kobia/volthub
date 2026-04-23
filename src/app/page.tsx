"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "../components/product-card";
import { CategoryBannerCard, type CategoryBannerCardProps } from "../components/category-banner-card";
import { useAuth } from "../components/auth/auth-provider";
import { fetchProducts, type Product } from "../lib/products";
import type { CategorySlug } from "../lib/types";

const IMAGE_CATEGORY_CARDS: CategoryBannerCardProps[] = [
  {
    title: "Fresh Food",
    subtitle: "Avocados, tomatoes, greens",
    href: "/category/groceries",
    image: "https://ik.imagekit.io/0iaahkrcv/freshfoods.png",
  },
  {
    title: "Beverages",
    subtitle: "Water, juice, sodas",
    href: "/category/beverages",
    image: "https://ik.imagekit.io/0iaahkrcv/beverages.png",
  },
  {
    title: "Pantry Refill",
    subtitle: "Flour, rice, sugar, cooking basics",
    href: "/category/groceries",
    gradient:
      "linear-gradient(145deg,rgba(14,19,28,1) 0%,rgba(18,24,34,1) 60%,rgba(10,14,20,1) 100%)",
  },
  {
    title: "Bakery & Snacks",
    subtitle: "Biscuits, cakes, crisps",
    href: "/category/snacks",
    image:
      "https://ik.imagekit.io/0iaahkrcv/snacks.png?updatedAt=1775961216246",
  },
  {
    title: "Personal Care",
    subtitle: "Body, bath, oral care",
    href: "/category/personal-care",
    image: "https://ik.imagekit.io/0iaahkrcv/bodycare.png",
  },
  {
    title: "Cleaning",
    subtitle: "Laundry, dish, toilet care",
    href: "/category/household",
    image: "https://ik.imagekit.io/0iaahkrcv/cleaning.png",
  },
  {
    title: "Baby Picks",
    subtitle: "Diapers, wipes, gentle care",
    href: "/shop",
    image: "https://ik.imagekit.io/0iaahkrcv/babypicks.png",
    featured: true,
  },
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
  const { authReady, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authReady) return;

    let mounted = true;

    async function load() {
      setLoading(true);
      const data = await fetchProducts();
      if (!mounted) return;
      setProducts(data);
      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [authReady, user?.id]);

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
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-6">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden">
        {/* Hero Image - Full Focus */}
        <div className="relative">
          {/* Image Container with Elegant Framing */}
          <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl aspect-square sm:aspect-auto sm:h-[500px] lg:h-[600px]">
            {/* Soft Gradient Overlay for Depth */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            
            {/* Hero Image */}
            <Image
              src="/images/canvushero.png"
              alt="Nairobi skyline with everyday essentials basket"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
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
          eyebrow="Shop by category"
          title="Your everyday aisles"
          description="Tap a category to browse and add to basket."
          ctaHref="/shop"
          ctaLabel="Browse full shop"
        />

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {IMAGE_CATEGORY_CARDS.map((card) => (
            <CategoryBannerCard key={card.title} {...card} />
          ))}
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
              Canvus wholesale division
            </div>
            <h2 className="mt-2.5 max-w-[12ch] font-serif text-3xl leading-tight text-white sm:text-4xl">
              Premium bulk products, same Canvus checkout.
            </h2>
            <p className="mt-3.5 text-xs leading-5 text-white/72 sm:text-sm sm:leading-6">
              Chargers, audio, power, and wearables in the same checkout.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <Link
                href="/category/electronics"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-xs font-semibold text-[#101418] transition-all hover:scale-[1.02]"
              >
                Shop Canvus
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
