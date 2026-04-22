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
  "groceries",
  "beverages",
  "household",
  "snacks",
  "personal-care",
  "electronics",
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
export function mapDBProductToProduct(dbProduct: DBProduct): Product {
  return {
    id: dbProduct.id,
    slug: dbProduct.slug,
    name: dbProduct.name,
    brand: dbProduct.brand || "Canvus",
    category: normalizeCategorySlug(dbProduct.category),
    priceKes: dbProduct.price,
    image: dbProduct.image_url || "/product-placeholder.png",
    description: dbProduct.description || "",
    stock: dbProduct.stock,
    rating: Number(dbProduct.rating || 0),
    reviewsCount: Number(dbProduct.reviews_count || 0),
    is_active: dbProduct.is_active,
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
      .or("is_archived.is.null,is_archived.eq.false")
      .gt("stock", 0);

    if (error) {
      console.error("fetchProducts failed:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return [];
    }

    return (data || []).map(mapDBProductToProduct);
  } catch (error) {
    console.error("fetchProducts threw an exception:", error);
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
      .or("is_archived.is.null,is_archived.eq.false")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching product:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return mapDBProductToProduct(data);
  } catch (err) {
    console.error("Exception fetching product:", err);
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
      .or("is_archived.is.null,is_archived.eq.false")
      .gt("stock", 0);

    if (error) {
      console.error("fetchProductsByCategory failed:", {
        category: normalized,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return [];
    }
    return (data || []).map(mapDBProductToProduct);
  } catch (error) {
    console.error("fetchProductsByCategory threw an exception:", {
      category: normalized,
      error,
    });
    return [];
  }
}
