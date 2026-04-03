"use client";
import { useEffect, useState } from "react";
import { fetchProducts, Product } from "../lib/products";
import { ProductCard } from "../components/product-card";
import Link from "next/link";
import Image from "next/image";

const HOME_UTILITY_BAR = "Fast WhatsApp support · M-Pesa accepted · Nairobi same-day delivery";

const TRUST_ITEMS = [
  "M-Pesa accepted",
  "Nairobi same-day delivery",
  "Nationwide courier 1–3 working days",
  "Easy faulty return policy",
];

const VALUE_COLLECTIONS = [
  { title: "Daily essentials", subtitle: "Trusted picks for everyday use" },
  { title: "Fast charging setup", subtitle: "Power up without waiting" },
  { title: "Budget smart audio", subtitle: "Clear sound from trusted models" },
];

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

  const featured = products.slice(0, 8);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  return (
    <div>
      <div className="bg-black text-white text-xs xl:text-sm text-center font-medium tracking-wide py-2">
        {HOME_UTILITY_BAR}
      </div>
      <div className="mx-auto max-w-7xl px-6">
        <HeroSlider />

        <section className="mt-6">
        <div className="rounded-full px-4 py-2 text-xs grid grid-cols-3 gap-2 text-center border bg-white dark:bg-black">
          <div className="opacity-80">Quality Gadgets</div>
          <div className="opacity-80">Fast Delivery</div>
          <div className="opacity-80">M‑Pesa Friendly</div>
        </div>
      </section>

      <section className="mt-12">
        <div className="font-serif text-2xl mb-6">Shop by Category</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { slug: "audio", title: "Audio" },
            { slug: "smartwatches", title: "Smartwatches" },
            { slug: "chargers-cables", title: "Chargers & Cables" },
            { slug: "power-banks", title: "Power Banks" },
            { slug: "phone-accessories", title: "Phone Accessories" },
            { slug: "speakers", title: "Speakers" },
            { slug: "new-arrivals", title: "New Arrivals", href: "/shop" },
          ].map((c) => (
            <Link
              key={c.slug}
              href={c.href ?? `/category/${c.slug}`}
              className="rounded-xl border p-6 bg-white dark:bg-black hover:opacity-90 text-center"
            >
              {c.title}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-6 mb-6">
          <div>
            <div className="font-serif text-2xl">Featured products</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Popular picks that ship fast in Kenya.
            </div>
          </div>
          <Link href="/shop" className="rounded-full px-4 py-2 border text-sm">
            Shop all
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="rounded-2xl border border-black/10 dark:border-white/10 p-10 bg-white dark:bg-black text-center">
            <div className="font-serif text-2xl">Products coming soon</div>
            <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              We’re preparing the catalog. Check back soon.
            </div>
            <div className="mt-6">
              <Link href="/shop" className="inline-block rounded-full px-5 py-2 border text-sm">
                Browse categories
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 flex flex-wrap items-center justify-center gap-4 rounded-2xl border bg-white/90 dark:bg-black/70 border-black/10 dark:border-white/10 p-4">
        {TRUST_ITEMS.map((item) => (
          <div key={item} className="flex items-center gap-2 rounded-lg bg-zinc-100/70 dark:bg-white/10 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">
            <span>✅</span>
            <span>{item}</span>
          </div>
        ))}
      </section>

      <section className="mt-12 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Trusted picks",
            body: "Practical gadgets and accessories selected for everyday use.",
          },
          {
            title: "Fast delivery",
            body: "Same‑day Nairobi delivery options and nationwide courier.",
          },
          {
            title: "Support on WhatsApp",
            body: "Ask questions before you buy — we’ll help you choose the right item.",
          },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border p-6 bg-white dark:bg-black">
            <div className="font-serif text-xl">{c.title}</div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{c.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl">Big value picks</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Handpicked products under KES 5,000. No fake markdowns, just honest value.
            </p>
          </div>
          <Link href="/shop" className="rounded-full border px-4 py-2 text-sm">
            Browse all value picks
          </Link>
        </div>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.slice(0, 2).map((p) => (
            <Link key={p.id} href={`/product/${p.slug}`} className="rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900 hover:border-[color:var(--accent)] transition-colors">
              <div className="text-xs text-zinc-500">Featured</div>
              <div className="mt-2 font-medium text-zinc-900 dark:text-white">{p.name}</div>
              <div className="mt-1 text-sm font-semibold">KES {p.priceKes.toLocaleString()}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-2xl">Curated collections</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Intent-based picks for faster decision making</p>
        </div>
        <div className="mt-4 grid sm:grid-cols-3 gap-4">
          {VALUE_COLLECTIONS.map((c) => (
            <div key={c.title} className="rounded-xl border p-5 bg-white dark:bg-black dark:border-white/10">
              <div className="text-sm font-bold text-zinc-900 dark:text-white">{c.title}</div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{c.subtitle}</div>
              <div className="mt-3 grid gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                {featured.slice(0, 2).map((p) => (
                  <Link key={`${c.title}-${p.id}`} href={`/product/${p.slug}`} className="rounded-lg border p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs">KES {p.priceKes.toLocaleString()}</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-black p-6">
        <h2 className="font-serif text-2xl">Why buy from VoltHub</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          A focused Kenyan gadget specialist with real products, clear terms, and fast support.
        </p>
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900">
            <div className="font-semibold">Curated selection</div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">We stock only reliable accessories that match daily needs.</p>
          </div>
          <div className="rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900">
            <div className="font-semibold">Order clarity</div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">No hidden fees, no fake discounts — just up-front pricing.</p>
          </div>
          <div className="rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900">
            <div className="font-semibold">Trustworthy support</div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">WhatsApp help for questions before and after purchase.</p>
          </div>
          <div className="rounded-xl border p-4 bg-zinc-50 dark:bg-zinc-900">
            <div className="font-semibold">Delivery confidence</div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Nairobi same-day and nationwide service with tracking.</p>
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-xl border p-6 bg-white dark:bg-black">
        <div className="font-serif text-2xl">Delivery & payment</div>
        <div className="mt-4 grid sm:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="font-medium">Nairobi delivery</div>
            <div className="text-zinc-600 dark:text-zinc-400">Same‑day options available</div>
          </div>
          <div>
            <div className="font-medium">Nationwide courier</div>
            <div className="text-zinc-600 dark:text-zinc-400">1‑3 working days</div>
          </div>
          <div>
            <div className="font-medium">Pay with M‑Pesa</div>
            <div className="text-zinc-600 dark:text-zinc-400">Clear instructions after you order</div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="rounded-full px-5 py-2 bg-[color:var(--accent)] text-white text-sm"
          >
            Start shopping
          </Link>
          <Link
            href="/offers"
            className="rounded-full px-5 py-2 border text-sm"
          >
            View deals
          </Link>
        </div>
      </section>
    </div>
  </div>
  );
}

function HeroSlider() {
  const noise =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>";
  const imageUrl =
    "https://images.pexels.com/photos/4792733/pexels-photo-4792733.jpeg?auto=compress&cs=tinysrgb&w=1200";
  const blur =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><rect width='100%' height='100%' fill='%23e8f0ff'/></svg>";

  return (
    <section className="relative mt-8 min-h-[92svh] px-4 md:px-6" aria-label="VoltHub hero">
      <div className="absolute inset-0 pointer-events-none -z-10">
        <SlideBackground />
      </div>

      <div className="relative mx-auto max-w-7xl rounded-[32px] overflow-hidden bg-white/80 dark:bg-black/60 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.08)] animate-[fadeCard_600ms_ease-out_both]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply"
          style={{ backgroundImage: `url(${noise})`, backgroundSize: "200px" }}
        />

        <div className="grid md:grid-cols-2">
          <div className="px-6 md:px-10 py-10 lg:py-14 flex items-center">
            <div className="max-w-xl">
              <h1 className="font-serif text-5xl md:text-6xl leading-tight tracking-[0.01em]">
                <span className="block">Quality gadgets for Kenyan life</span>
                <span className="block">Fast delivery, clear support</span>
              </h1>
              <p className="mt-4 text-sm md:text-base opacity-90">
                Shop proven electronics curated for reliability: earbuds, power banks, smartwatches, and
                mobile accessories with practical support and honest pricing.
              </p>
              <p className="mt-3 text-xs md:text-sm text-zinc-300">
                M-Pesa payments, Nairobi same-day delivery, nationwide courier, easy returns.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="rounded-2xl px-6 py-3 text-sm font-medium bg-[color:var(--accent)] text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] hover:shadow-[0_12px_32px_rgba(37,99,235,0.45)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2"
                >
                  Shop gadgets
                </Link>
                <Link
                  href="https://wa.me/254798966238?text=Hi%20VoltHub,%20I%20need%20help%20choosing%20a%20gadget."
                  target="_blank"
                  rel="noopener"
                  className="text-sm underline opacity-90 hover:opacity-100"
                >
                  WhatsApp support
                </Link>
              </div>
            </div>
          </div>
          <div className="relative h-[46vh] md:h-auto min-h-[46vh]">
            <Image
              src={imageUrl}
              alt="Modern gadgets and accessories"
              fill
              priority
              quality={55}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
              placeholder="blur"
              blurDataURL={blur}
              className="object-cover animate-[imageZoom_20s_ease_infinite]"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/55 via-black/25 to-transparent" />
          </div>
        </div>

        

        <style jsx>{`
          @keyframes gradientShift {
            0% { transform: translate3d(-2%, -2%, 0) scale(1.02); }
            50% { transform: translate3d(2%, 2%, 0) scale(1.04); }
            100% { transform: translate3d(-2%, -2%, 0) scale(1.02); }
          }
          @keyframes fadeUp {
            0% { opacity: 0; transform: translate3d(0, 12px, 0); }
            100% { opacity: 1; transform: translate3d(0, 0, 0); }
          }
          @keyframes imageZoom {
            0% { transform: scale(1.05) translate3d(0,0,0); }
            50% { transform: scale(1.08) translate3d(0,0,0); }
            100% { transform: scale(1.05) translate3d(0,0,0); }
          }
          @keyframes fadeCard {
            0% { opacity: 0; transform: translate3d(0, 8px, 0); }
            100% { opacity: 1; transform: translate3d(0, 0, 0); }
          }
        `}</style>
      </div>
    </section>
  );
}

function SlideBackground() {
  return (
    <div className="w-full h-full relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--accent-soft)] via-[color:var(--background)] to-[color:var(--background)] animate-[gradientShift_14s_ease_infinite] opacity-80" />
    </div>
  );
}
