import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProductBySlug, fetchProducts, type Product } from "../../../lib/products";
import { AddToCartButton } from "../../../components/add-to-cart-button";
import { AddToWishlistButton } from "../../../components/add-to-wishlist-button";
import { ReviewButton } from "../../../components/review-button";
import WholesalePricing from "../../../components/wholesale/wholesale-pricing";
import type { CategorySlug } from "../../../lib/types";

function buildWhatsAppOrderUrl(message: string) {
  return `https://wa.me/254798966238?text=${encodeURIComponent(message)}`;
}

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

function getHighlights(category: CategorySlug) {
  const common = ["Fast delivery in Kenya", "Support on WhatsApp"];
  const byCategory: Record<CategorySlug, string[]> = {
    audio: ["Clear sound for calls and music", "Comfortable for daily use", ...common],
    smartwatches: ["Fitness tracking and notifications", "All‑day battery focus", ...common],
    "chargers-cables": ["Reliable fast charging", "Travel‑friendly size", ...common],
    "power-banks": ["Charge on the go", "High‑capacity everyday backup", ...common],
    "phone-accessories": ["Protection and everyday convenience", "Easy to carry and use", ...common],
    speakers: ["Portable sound for home and outdoors", "Easy pairing and controls", ...common],
    groceries: ["Fresh and quality products", "Essential for daily cooking", ...common],
    beverages: ["Refreshing drinks for every occasion", "Quality and variety", ...common],
    household: ["Essentials for your home", "Durable and practical", ...common],
    snacks: ["Tasty treats and quick bites", "Perfect for sharing", ...common],
    "personal-care": ["Quality care products", "Gentle and effective", ...common],
    electronics: ["Reliable tech for everyday use", "Latest and trusted brands", ...common],
  };
  return byCategory[category];
}

export default async function Page({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const product = await fetchProductBySlug(slug);
  if (!product) return notFound();

  const allProducts = await fetchProducts();
  const related = allProducts
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  const inStock = product.stock > 0;
  const categoryLabel = CATEGORY_LABELS[product.category as CategorySlug] ?? "Gadgets";
  const highlights = getHighlights(product.category as CategorySlug);
  const waMessage = `Hello Canvus, I want to order: ${product.name} - Total: KES ${product.priceKes.toLocaleString()}`;
  const waUrl = buildWhatsAppOrderUrl(waMessage);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/shop" className="text-sm underline hover:opacity-80">
          Back to shop
        </Link>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">{categoryLabel}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden border bg-white dark:bg-black">
          <img
            src={product.image && product.image.startsWith("http") ? product.image : "/product-placeholder.png"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-5">
          <div>
            <div className="text-sm text-zinc-500">{product.brand}</div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              {product.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs rounded-full px-3 py-1 border border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                {inStock ? `${product.stock} in stock` : "Out of stock"}
              </span>
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                {product.rating > 0 ? `${product.rating.toFixed(1)} rating` : "Ratings coming soon"}
              </span>
            </div>
          </div>

          <WholesalePricing product={product} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-700 dark:text-zinc-300 md:grid-cols-1">
            <div>✅ M-Pesa payment available</div>
            <div>✅ Meru same-day delivery</div>
            <div>✅ Nationwide 1–3 working days</div>
            <div>✅ Easy return if item arrives faulty</div>
          </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <AddToCartButton productId={product.id} />
                <AddToWishlistButton productId={product.id} />
              </div>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                WhatsApp order for support
              </a>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Need help before ordering? Chat with us on WhatsApp for quick assistance.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="font-medium text-lg text-zinc-900 dark:text-white">Product description</h2>
              <p className="mt-2 text-sm leading-7 text-zinc-700 dark:text-zinc-300">{product.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="font-medium text-sm text-zinc-900 dark:text-white">Compatibility</h3>
                <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  <li>• Works with Android phones</li>
                  <li>• Works with iPhones</li>
                  <li>• Works with laptops and tablets that support Bluetooth</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="font-medium text-sm text-zinc-900 dark:text-white">What’s in the box</h3>
                <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  <li>• 1 × {product.name}</li>
                  <li>• 1 × charging cable</li>
                  <li>• 1 × user guide</li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="font-medium text-sm text-zinc-900 dark:text-white">Why buy from Canvus</h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                <li>• Curated gadgets for everyday use</li>
                <li>• Fast support on WhatsApp</li>
                <li>• Clear pricing with no fake discounts</li>
                <li>• Delivery options across Kenya</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="font-medium text-sm text-zinc-900 dark:text-white">Key features</h3>
              <ul className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5 space-y-1">
                {highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="font-medium text-sm text-zinc-900 dark:text-white">Specifications</h3>
              <div className="mt-2 text-sm grid grid-cols-2 gap-3 text-zinc-700 dark:text-zinc-300">
                <div className="font-medium text-zinc-600 dark:text-zinc-400">Brand</div>
                <div>{product.brand}</div>
                <div className="font-medium text-zinc-600 dark:text-zinc-400">Category</div>
                <div>{categoryLabel}</div>
                <div className="font-medium text-zinc-600 dark:text-zinc-400">Stock</div>
                <div>{inStock ? `${product.stock} available` : "Currently unavailable"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="mb-3">
          <h2 className="font-serif text-2xl text-zinc-900 dark:text-white">You may also like</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Similar picks from Canvus.</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {related.map((p) => {
            return (
              <div key={p.id} className="rounded-xl border p-4 bg-white dark:bg-black">
                <Link href={`/product/${p.slug}`} className="block">
                  <div className="relative aspect-[4/5] rounded-md overflow-hidden">
                    <img
                      src={p.image && p.image.startsWith("http") ? p.image : "/product-placeholder.png"}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mt-3 text-xs text-zinc-500">{p.brand}</div>
                  <div className="font-medium text-sm text-zinc-900 dark:text-white">{p.name}</div>
                  <div className="mt-1 font-semibold text-zinc-800 dark:text-zinc-100">KES {p.priceKes.toLocaleString()}</div>
                  <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <span aria-hidden>☆☆☆☆☆</span>
                    <span className="ml-2">No reviews yet</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
