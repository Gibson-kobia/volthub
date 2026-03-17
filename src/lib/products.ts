import { Product, DBProduct, CategorySlug } from "./types";
import { getSupabase } from "./supabase";

export type { Product };

const CATEGORY_SLUGS: CategorySlug[] = [
  "audio",
  "smartwatches",
  "chargers-cables",
  "power-banks",
  "phone-accessories",
  "speakers",
];

const SEED_PRODUCTS: Product[] = [
  {
    id: "seed-volt-1",
    slug: "soundcore-a20i-earbuds",
    name: "Soundcore A20i Wireless Earbuds",
    brand: "Soundcore",
    category: "audio",
    priceKes: 2999,
    image: "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Compact earbuds with punchy sound, clear calls, and a pocket-friendly case for daily commuting.",
    stock: 18,
    rating: 4.6,
    reviewsCount: 128,
  },
  {
    id: "seed-volt-2",
    slug: "oraimo-watch-es-2",
    name: "Oraimo Watch ES 2",
    brand: "Oraimo",
    category: "smartwatches",
    priceKes: 5499,
    image: "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Everyday smartwatch with fitness tracking, notifications, and long-lasting battery for busy schedules.",
    stock: 12,
    rating: 4.4,
    reviewsCount: 84,
  },
  {
    id: "seed-volt-3",
    slug: "anker-20w-usb-c-charger",
    name: "Anker 20W USB‑C Fast Charger",
    brand: "Anker",
    category: "chargers-cables",
    priceKes: 2499,
    image: "https://images.pexels.com/photos/6168929/pexels-photo-6168929.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Fast, reliable USB‑C charging for phones and accessories. Compact build for travel and office setups.",
    stock: 25,
    rating: 4.7,
    reviewsCount: 201,
  },
  {
    id: "seed-volt-4",
    slug: "baseus-20000mah-power-bank",
    name: "Baseus 20,000mAh Power Bank",
    brand: "Baseus",
    category: "power-banks",
    priceKes: 4499,
    image: "https://images.pexels.com/photos/3921847/pexels-photo-3921847.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "High-capacity power bank for all-day charging. Ideal for travel, campus, and field work.",
    stock: 9,
    rating: 4.5,
    reviewsCount: 146,
  },
  {
    id: "seed-volt-5",
    slug: "spigen-rugged-armor-case",
    name: "Spigen Rugged Armor Phone Case",
    brand: "Spigen",
    category: "phone-accessories",
    priceKes: 1899,
    image: "https://images.pexels.com/photos/6194363/pexels-photo-6194363.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Durable, grippy protection with a slim profile. Built for daily drops and pocket wear.",
    stock: 30,
    rating: 4.6,
    reviewsCount: 97,
  },
  {
    id: "seed-volt-6",
    slug: "jbl-go-3-speaker",
    name: "JBL GO 3 Bluetooth Speaker",
    brand: "JBL",
    category: "speakers",
    priceKes: 4999,
    image: "https://images.pexels.com/photos/12046815/pexels-photo-12046815.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Portable speaker with bold sound and a rugged design. Great for home, picnics, and road trips.",
    stock: 14,
    rating: 4.5,
    reviewsCount: 164,
  },
];

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function normalizeCategorySlug(input: string): CategorySlug {
  const v = input.trim().toLowerCase();
  if ((CATEGORY_SLUGS as string[]).includes(v)) return v as CategorySlug;
  return "phone-accessories";
}

// Mapper to convert DB Product to Frontend Product
function mapDBProductToProduct(dbProduct: DBProduct): Product {
  return {
    id: dbProduct.id,
    slug: dbProduct.slug,
    name: dbProduct.name,
    brand: dbProduct.brand,
    category: normalizeCategorySlug(dbProduct.category),
    priceKes: dbProduct.price,
    image: dbProduct.image_url,
    description: dbProduct.description,
    stock: dbProduct.stock,
    rating: dbProduct.rating,
    reviewsCount: dbProduct.reviews_count,
  };
}

// --- ASYNC FUNCTIONS FOR SUPABASE ---

export async function fetchProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return SEED_PRODUCTS;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .gt("stock", 0);

    if (error) {
      return SEED_PRODUCTS;
    }

    return (data || []).map(mapDBProductToProduct);
  } catch {
    return SEED_PRODUCTS;
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return SEED_PRODUCTS.find((p) => p.slug === slug) ?? null;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return SEED_PRODUCTS.find((p) => p.slug === slug) ?? null;
    }
    return mapDBProductToProduct(data);
  } catch {
    return SEED_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }
}

export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  const normalized = normalizeCategorySlug(category);
  if (!isSupabaseConfigured()) return SEED_PRODUCTS.filter((p) => p.category === normalized);
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", normalized)
      .eq("is_active", true)
      .gt("stock", 0);

    if (error) return SEED_PRODUCTS.filter((p) => p.category === normalized);
    return (data || []).map(mapDBProductToProduct);
  } catch {
    return SEED_PRODUCTS.filter((p) => p.category === normalized);
  }
}
