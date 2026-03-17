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
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .gt("stock", 0);

    if (error) {
      return [];
    }

    return (data || []).map(mapDBProductToProduct);
  } catch {
    return [];
  }
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return null;
    }
    return mapDBProductToProduct(data);
  } catch {
    return null;
  }
}

export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  const normalized = normalizeCategorySlug(category);
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", normalized)
      .eq("is_active", true)
      .gt("stock", 0);

    if (error) return [];
    return (data || []).map(mapDBProductToProduct);
  } catch {
    return [];
  }
}
